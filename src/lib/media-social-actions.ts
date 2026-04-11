'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type MediaPreference = 'like' | 'dislike';

/**
 * Upsert the user's preference for a piece of media.
 */
export async function setMediaPreferenceAction(input: {
  mediaId: string;
  mediaType: string;
  reaction: MediaPreference | null;
  title?: string;
  posterUrl?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };

  if (!input.reaction) {
    const { error } = await (supabase.from('media_reactions') as any)
      .delete()
      .eq('user_id', user.id)
      .eq('media_id', input.mediaId)
      .eq('media_type', input.mediaType);

    if (error) return { error: error.message };
    revalidatePath('/vault');
    revalidatePath(`/media/${input.mediaType}/${input.mediaId}`);
    return { success: true, reaction: null };
  }

  const payload = {
    user_id: user.id,
    media_id: input.mediaId,
    media_type: input.mediaType,
    reaction: input.reaction,
    title: input.title || null,
    poster_url: input.posterUrl || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await (supabase.from('media_reactions') as any).upsert(payload, {
    onConflict: 'user_id,media_id,media_type'
  });

  if (error) return { error: error.message };
  revalidatePath('/vault');
  revalidatePath(`/media/${input.mediaType}/${input.mediaId}`);
  return { success: true, reaction: input.reaction };
}

/**
 * Get current user's preference for media.
 */
export async function getMediaPreferenceAction(mediaId: string, mediaType: string): Promise<MediaPreference | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await (supabase.from('media_reactions') as any)
    .select('reaction')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .eq('media_type', mediaType)
    .maybeSingle();

  return (data?.reaction as MediaPreference | undefined) || null;
}

/**
 * Get social preference statistics for a media item.
 */
export async function getMediaSocialStatsAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();

  const { data: reactions, error } = await (supabase.from('media_reactions') as any)
    .select('reaction')
    .eq('media_id', mediaId)
    .eq('media_type', mediaType);

  if (error || !reactions) return { likes: 0, dislikes: 0 };

  let likes = 0;
  let dislikes = 0;
  reactions.forEach((row: any) => {
    if (row.reaction === 'like') likes += 1;
    if (row.reaction === 'dislike') dislikes += 1;
  });

  return { likes, dislikes };
}

/**
 * Get activity from friends for a specific media item.
 */
export async function getFriendActivityAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get following IDs
  const { data: following } = await (supabase.from('follows') as any)
    .select('following_id')
    .eq('follower_id', user.id);
  
  const followingIds = (following || []).map((f: any) => f.following_id);
  if (followingIds.length === 0) return [];

  // Find friends who have this in their library
  const { data: entries, error } = await (supabase.from('media_entries') as any)
    .select(`
      user_id,
      profiles:user_id (username, avatar_url)
    `)
    .in('user_id', followingIds)
    .eq('external_id', mediaId)
    .eq('media_type', mediaType);

  if (error || !entries) return [];

  return entries.map((e: any) => ({
    userId: e.user_id,
    username: e.profiles.username,
    avatarUrl: e.profiles.avatar_url
  }));
}

/**
 * Get public dispatch posts that explicitly attached this media.
 */
export async function getPostsByMediaAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();
  const mediaRef = [{ id: mediaId, type: mediaType }];

  const { data, error } = await (supabase.from('dispatches') as any)
    .select(`
      id,
      content,
      media_refs,
      created_at,
      profiles:user_id (username, avatar_url)
    `)
    .contains('media_refs', mediaRef)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((post: any) => ({
    id: post.id,
    content: post.content,
    media_refs: post.media_refs || [],
    created_at: post.created_at,
    username: post.profiles?.username || 'user',
    avatar_url: post.profiles?.avatar_url || null,
  }));
}

/**
 * Get community rating statistics for a media item.
 */
export async function getMediaCommunityRatingAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();

  const { data: ratings, error } = await (supabase.from('media_ratings') as any)
    .select('rating')
    .eq('media_id', mediaId)
    .eq('media_type', mediaType);

  if (error || !ratings || ratings.length === 0) {
    return { average: 0, count: 0 };
  }

  const total = ratings.reduce((sum: number, row: any) => sum + row.rating, 0);
  const average = Math.round((total / ratings.length) * 10) / 10; // Round to 1 decimal place

  return { average, count: ratings.length };
}

/**
 * Get all media items liked by a specific user.
 */
export async function getUserLikesAction(userId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from('media_reactions') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('reaction', 'like')
    .order('updated_at', { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch user likes:", error);
    return [];
  }

  return (data as any[]).map(row => ({
    id: row.media_id,
    sourceId: row.media_id,
    type: row.media_type,
    displayTitle: row.title || 'Untitled',
    posterUrl: row.poster_url,
    // Map to UniversalMedia-like structure for DiscoveryCard
  }));
}
