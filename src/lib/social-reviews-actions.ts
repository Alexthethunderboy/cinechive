'use server';

import { createClient } from '@/lib/supabase/server';

export async function getPublicReviews(externalId: string, mediaType: string) {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('media_entries')
    .select(`
      id,
      notes,
      rating,
      created_at,
      profiles (
        username,
        display_name,
        avatar_url
      ),
      mood_tags (
        label,
        emoji,
        color
      )
    `)
    .eq('external_id', externalId)
    .eq('media_type', mediaType as any)
    .not('notes', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20) as any);

  if (error) {
    console.error("Failed to fetch public reviews:", error);
    return [];
  }

  return data as any[];
}

export async function getFriendReviews(externalId: string, mediaType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get following IDs
  const { data: following } = await (supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id) as any);

  if (!following || following.length === 0) return [];

  const followingIds = following.map((f: any) => f.following_id);

  const { data, error } = await (supabase
    .from('media_entries')
    .select(`
      id,
      notes,
      rating,
      created_at,
      profiles (
        username,
        display_name,
        avatar_url
      ),
      mood_tags (
        label,
        emoji,
        color
      )
    `)
    .eq('external_id', externalId)
    .eq('media_type', mediaType as any)
    .in('user_id', followingIds)
    .not('notes', 'is', null)
    .order('created_at', { ascending: false }) as any);

  if (error) {
    console.error("Failed to fetch friend reviews:", error);
    return [];
  }

  return data as any[];
}

