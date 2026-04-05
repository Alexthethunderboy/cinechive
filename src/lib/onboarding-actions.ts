'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserOnboardingTaste } from '@/lib/supabase/database.types';

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

  // Delete existing tastes for this user so re-runs are clean
  await (supabase
    .from('user_onboarding_tastes')
    .delete()
    .eq('user_id', user.id) as any);

  const sb = supabase as any;

  if (selections.length > 0) {
    const rows = selections.map((s) => ({
      user_id: user.id,
      category: s.category,
      value: s.value,
      display_name: s.display_name || null,
      poster_url: s.poster_url || null,
    }));

    const { error: insertError } = await sb
      .from('user_onboarding_tastes')
      .insert(rows);

    if (insertError) {
      console.error('saveOnboardingTastes insert error:', insertError);
      return { error: insertError.message };
    }
  }

  // Mark onboarding complete on the profile
  const { error: profileError } = await sb
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id);

  if (profileError) {
    console.error('saveOnboardingTastes profile update error:', profileError);
    return { error: profileError.message };
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tastesRes, entriesRes, profileRes] = await Promise.all([
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
    stats: {
      entriesCount: entries.length,
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

  // 2. Fetch tastes and entries
  const [tastesRes, entriesRes] = await Promise.all([
    (supabase
      .from('user_onboarding_tastes')
      .select('*')
      .eq('user_id', profile.id) as any),
    (supabase
      .from('media_entries')
      .select('*, mood_tags (label)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }) as any),
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
    stats: {
      entriesCount: entries.length,
      vibeDistribution,
      topAuteur,
      primaryStyle: Object.entries(vibeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      topGenres: onboardingTastes.filter(t => t.category === 'genre').map(t => t.display_name),
    },
  };
}
