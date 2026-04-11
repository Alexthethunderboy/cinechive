'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { UserOnboardingTaste } from '@/lib/supabase/database.types';
import { getUserLikesAction } from './media-social-actions';
import { getFollowCountsAction } from './social-actions';

export interface OnboardingSelection {
  category: 'movie' | 'style' | 'creator' | 'genre';
  value: string;
  display_name?: string;
  poster_url?: string;
}

/**
 * Fetch the current user's onboarding taste selections.
 */
export async function getOnboardingTastes(): Promise<UserOnboardingTaste[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase
    .from('user_onboarding_tastes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }) as any);

  if (error) {
    console.error('getOnboardingTastes error:', error);
    return [];
  }

  return (data as UserOnboardingTaste[]) || [];
}

/**
 * Save onboarding selections in bulk and mark profile as onboarding_completed.
 * Deletes existing rows first so this is idempotent (re-do onboarding = fresh start).
 */
export async function saveOnboardingTastes(selections: OnboardingSelection[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  const movieCount = selections.filter((s) => s.category === 'movie').length;
  const genreCount = selections.filter((s) => s.category === 'genre').length;
  const creatorCount = selections.filter((s) => s.category === 'creator').length;
  if (movieCount < 3 || genreCount < 1 || creatorCount < 1) {
    return { error: 'Please complete all onboarding steps before continuing.' };
  }

  const { data, error } = await (supabase as any).rpc('complete_onboarding', {
    p_selections: selections,
  });

  if (error) {
    console.error('saveOnboardingTastes rpc error:', error);
    return { error: error.message };
  }
  if (!data?.ok) {
    return { error: data?.error || 'Could not save onboarding preferences.' };
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return { success: true };
}

/**
 * Fetch everything the profile page needs in one call:
 * onboarding tastes + user's vault entries for style profile calculation.
 */
export async function getProfilePageData() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tastesRes, entriesRes, profileRes, likedMedia, followCounts] = await Promise.all([
    (supabase
      .from('user_onboarding_tastes')
      .select('*')
      .eq('user_id', user.id) as any),
    (supabase
      .from('media_entries')
      .select('*, mood_tags (label)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as any),
    (supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as any),
    getUserLikesAction(user.id),
    getFollowCountsAction(user.id),
  ]);

  const onboardingTastes: UserOnboardingTaste[] = tastesRes.data || [];
  const entries: any[] = (entriesRes.data || []).map((item: any) => ({
    ...item,
    media_id: item.external_id,
    classification: item.mood_tags?.label,
  }));
  const profile = profileRes.data;

  // Calculate vibe distribution from vault entries
  const vibeDistribution: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.classification) {
      vibeDistribution[entry.classification] = (vibeDistribution[entry.classification] || 0) + 1;
    }
  }

  // Calculate top auteur (director) from entry metadata — placeholder until
  // media entries store director. Fall back to onboarding creator picks.
  const creatorTastes = onboardingTastes.filter((t) => t.category === 'creator');
  const topAuteur = creatorTastes[0]?.display_name || null;

  return {
    profile,
    onboardingTastes,
    entries,
    likedMedia: likedMedia || [],
    followCounts: followCounts || { followers: 0, following: 0 },
    stats: {
      entriesCount: entries.length,
      likesCount: (likedMedia || []).length,
      vibeDistribution,
      topAuteur,
      primaryStyle: Object.entries(vibeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      topGenres: onboardingTastes.filter(t => t.category === 'genre').map(t => t.display_name),
    },
  };
}
/**
 * Fetch everything a profile page needs by username.
 */
export async function getProfileByUsername(username: string) {
  noStore();
  const supabase = await createClient();
  
  // 1. Find profile by username (try exact match first)
  let { data: profile, error: profileError } = await (supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single() as any);

  // 2. If not found, try with 'u.' prefix (legacy support during migration)
  if (!profile && !username.startsWith('u.')) {
     const legacyRes = await (supabase
       .from('profiles')
       .select('*')
       .eq('username', `u.${username}`)
       .single() as any);
     
     if (legacyRes.data) {
       profile = legacyRes.data;
       profileError = null;
     }
  }

  if (profileError || !profile) return null;

  // 2. Fetch tastes, entries, likes, and follows
  const [tastesRes, entriesRes, likedMedia, followCounts] = await Promise.all([
    (supabase
      .from('user_onboarding_tastes')
      .select('*')
      .eq('user_id', profile.id) as any),
    (supabase
      .from('media_entries')
      .select('*, mood_tags (label)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }) as any),
    getUserLikesAction(profile.id),
    getFollowCountsAction(profile.id),
  ]);

  const onboardingTastes: UserOnboardingTaste[] = tastesRes.data || [];
  const entries: any[] = (entriesRes.data || []).map((item: any) => ({
    ...item,
    media_id: item.external_id,
    classification: item.mood_tags?.label,
  }));

  // 3. Calculate distributions
  const vibeDistribution: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.classification) {
      vibeDistribution[entry.classification] = (vibeDistribution[entry.classification] || 0) + 1;
    }
  }

  const creatorTastes = onboardingTastes.filter((t) => t.category === 'creator');
  const topAuteur = creatorTastes[0]?.display_name || null;

  return {
    profile,
    onboardingTastes,
    entries,
    likedMedia: likedMedia || [],
    followCounts: followCounts || { followers: 0, following: 0 },
    stats: {
      entriesCount: entries.length,
      likesCount: (likedMedia || []).length,
      vibeDistribution,
      topAuteur,
      primaryStyle: Object.entries(vibeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      topGenres: onboardingTastes.filter(t => t.category === 'genre').map(t => t.display_name),
    },
  };
}
