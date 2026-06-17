'use server';

import { createClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await (supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, avatar_seed, avatar_mode, avatar_character, avatar_animation, bio, onboarding_completed, created_at')
    .eq('id', user.id)
    .single() as any);

  return { ...user, profile };
}

export async function getProfile(username: string) {
  const supabase = await createClient();
  const { data: profile, error } = await (supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single() as any);

  if (error || !profile) return null;

  const { count: entriesCount } = await (supabase
    .from('media_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id) as any);

  return { profile, stats: { entriesCount: entriesCount || 0 } };
}

export async function getMediaEntryForUser(externalId: string, mediaType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await (supabase
    .from('media_entries')
    .select(`
      *,
      mood_tags (label)
    `)
    .eq('user_id', user.id)
    .eq('external_id', externalId)
    .eq('media_type', mediaType as any)
    .maybeSingle() as any);

  if (error || !data) return null;

  return {
    ...data,
    classification: data.mood_tags?.label,
  };
}

