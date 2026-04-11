'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { createNotificationInternal } from './social-notification-actions';
import type { SocialActionResult } from './social-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FollowUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface FollowCounts {
  followers: number;
  following: number;
}

// ─── Core Follow / Unfollow ──────────────────────────────────────────────────

/**
 * Follow a user. Returns { success } or { error }.
 */
export async function followUserAction(targetUserId: string): Promise<SocialActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.', code: 'AUTH_REQUIRED' };
  if (user.id === targetUserId) return { error: 'Cannot follow yourself.', code: 'VALIDATION_ERROR' };

  const { error } = await (supabase.from('follows') as any).insert({
    follower_id: user.id,
    following_id: targetUserId,
  });

  if (error) {
    // Unique constraint means already following — treat as success
    if (error.code === '23505') return { success: true };
    return { error: error.message, code: 'UNKNOWN_ERROR' };
  }

  // Create follow notification for the recipient.
  await createNotificationInternal(targetUserId, 'follow', user.id, user.id, 'profile');

  revalidatePath('/community');
  revalidatePath('/people');
  revalidatePath('/profile', 'layout');
  return { success: true };
}

/**
 * Unfollow a user. Returns { success } or { error }.
 */
export async function unfollowUserAction(targetUserId: string): Promise<SocialActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.', code: 'AUTH_REQUIRED' };

  const { error } = await (supabase
    .from('follows') as any)
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) return { error: error.message, code: 'UNKNOWN_ERROR' };

  revalidatePath('/community');
  revalidatePath('/people');
  revalidatePath('/profile', 'layout');
  return { success: true };
}

// ─── Status Checks ───────────────────────────────────────────────────────────

/**
 * Check if the current user is following a specific user.
 */
export async function getFollowStatusAction(targetUserId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await (supabase
    .from('follows') as any)
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  return !!data;
}

/**
 * Get follower and following counts for any user.
 */
export async function getFollowCountsAction(userId: string): Promise<FollowCounts> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await (supabase as any).rpc('get_follow_counts', {
    target_id: userId
  });

  if (error) {
    console.error(`[Social] RPC Error for ${userId}:`, error);
    return { followers: 0, following: 0 };
  }

  // Ensure 'data' is valid before returning
  const counts = data as FollowCounts | null;
  
  console.log(`[Social] RPC Counts for ${userId}:`, counts);

  return {
    followers: counts?.followers ?? 0,
    following: counts?.following ?? 0,
  };
}

/**
 * Get IDs of all users the current user is following. Used for feed filtering.
 */
export async function getFollowingIdsAction(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await (supabase
    .from('follows') as any)
    .select('following_id')
    .eq('follower_id', user.id);

  return (data ?? []).map((row: any) => row.following_id);
}

// ─── Lists ───────────────────────────────────────────────────────────────────

/**
 * Get the list of users following the given userId.
 */
export async function getFollowersAction(userId: string): Promise<FollowUser[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('follows') as any)
    .select(`
      follower:follower_id (
        id, username, display_name, avatar_url, bio
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => row.follower as FollowUser);
}

/**
 * Get the list of users the given userId is following.
 */
export async function getFollowingAction(userId: string): Promise<FollowUser[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('follows') as any)
    .select(`
      following:following_id (
        id, username, display_name, avatar_url, bio
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => row.following as FollowUser);
}

// ─── Discovery ───────────────────────────────────────────────────────────────

/**
 * Search users by username or display_name.
 */
export async function searchUsersAction(query: string): Promise<FollowUser[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await (supabase
    .from('profiles') as any)
    .select('id, username, display_name, avatar_url, bio')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .neq('id', user?.id ?? '')
    .limit(20);

  if (error) return [];
  return data as FollowUser[];
}

/**
 * Get suggested users — other CineChive members the current user doesn't follow yet.
 * Ordered by number of followers (rough popularity signal).
 */
export async function getSuggestedUsersAction(): Promise<FollowUser[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Users the current user already follows
  const followingIds = await getFollowingIdsAction();
  const excluded = [user.id, ...followingIds];

  const { data, error } = await (supabase
    .from('profiles') as any)
    .select('id, username, display_name, avatar_url, bio')
    .not('id', 'in', `(${excluded.map((id) => `"${id}"`).join(',')})`)
    .limit(10);

  if (error) return [];
  return data as FollowUser[];
}
