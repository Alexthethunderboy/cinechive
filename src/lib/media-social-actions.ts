'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Upsert a community rating (1-10) for a piece of media.
 */
export async function upsertMediaRatingAction(mediaId: string, mediaType: string, rating: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };

  const { error } = await (supabase.from('media_ratings') as any).upsert({
    user_id: user.id,
    media_id: mediaId,
    media_type: mediaType,
    rating,
    updated_at: new Date().toISOString()
  });

  if (error) return { error: error.message };
  revalidatePath(`/media/${mediaType}/${mediaId}`);
  return { success: true };
}

/**
 * Upsert a community review for a piece of media.
 */
export async function upsertMediaReviewAction(mediaId: string, mediaType: string, content: string, isSpoiler: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };

  const { error } = await (supabase.from('media_reviews') as any).upsert({
    user_id: user.id,
    media_id: mediaId,
    media_type: mediaType,
    content,
    is_spoiler: isSpoiler,
    updated_at: new Date().toISOString()
  });

  if (error) return { error: error.message };
  revalidatePath(`/media/${mediaType}/${mediaId}`);
  return { success: true };
}

/**
 * Get community statistics for a piece of media.
 */
export async function getMediaSocialStatsAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();
  
  const { data: ratings, error } = await (supabase.from('media_ratings') as any)
    .select('rating')
    .eq('media_id', mediaId)
    .eq('media_type', mediaType);

  if (error || !ratings) return { average: 0, count: 0 };

  const total = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
  const average = ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

  return {
    average: Number(average),
    count: ratings.length
  };
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
