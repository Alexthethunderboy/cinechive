'use server';

import { createClient } from '@/lib/supabase/server';

export interface CompatibilityScore {
  score: number;
  label: 'Low' | 'Moderate' | 'High' | 'Cinematic Twin';
  commonMedia: { id: string, title: string, posterUrl: string | null }[];
  commonStyles: string[];
}

/**
 * Calculate the cinematic taste compatibility between two users.
 * Algorithm:
 * 40% - Shared Media IDs in Vault
 * 40% - Shared Preferred Cinematic Styles (Moods)
 * 20% - Shared Onboarding Genres
 */
export async function calculateTasteMatchAction(userId1: string, userId2: string): Promise<CompatibilityScore> {
  const supabase = await createClient();

  // 1. Fetch Vault Entries for both users
  const [entries1, entries2] = await Promise.all([
    (supabase.from('media_entries') as any).select('external_id, title, poster_url, mood_tag_id, mood_tags(label)').eq('user_id', userId1),
    (supabase.from('media_entries') as any).select('external_id, title, poster_url, mood_tag_id, mood_tags(label)').eq('user_id', userId2)
  ]);

  const vault1 = (entries1.data || []) as any[];
  const vault2 = (entries2.data || []) as any[];

  // 2. Fetch Onboarding Tastes for both users
  const [tastes1, tastes2] = await Promise.all([
    (supabase.from('user_onboarding_tastes') as any).select('value, category').eq('user_id', userId1),
    (supabase.from('user_onboarding_tastes') as any).select('value, category').eq('user_id', userId2)
  ]);

  const onboarding1 = (tastes1.data || []) as any[];
  const onboarding2 = (tastes2.data || []) as any[];

  // --- Logic 1: Shared Media (40%) ---
  const ids1 = new Set(vault1.map(v => v.external_id));
  const ids2 = new Set(vault2.map(v => v.external_id));
  const commonIds = Array.from(ids1).filter(id => ids2.has(id));
  
  const mediaScore = Math.min((commonIds.length / Math.max(ids1.size, 1)) * 100, 100) * 0.4;
  const commonMediaDetails = vault1.filter(v => commonIds.includes(v.external_id)).slice(0, 5).map(v => ({
    id: v.external_id,
    title: v.title,
    posterUrl: v.poster_url
  }));

  // --- Logic 2: Shared Styles (40%) ---
  const styles1 = Array.from(new Set(vault1.map(v => v.mood_tags?.label).filter(Boolean)));
  const styles2 = Array.from(new Set(vault2.map(v => v.mood_tags?.label).filter(Boolean)));
  const commonStyles = styles1.filter(s => styles2.includes(s));
  
  const styleScore = Math.min((commonStyles.length / 4) * 100, 100) * 0.4; // Max out at 4 shared styles

  // --- Logic 3: Onboarding Genres (20%) ---
  const genres1 = onboarding1.filter(t => t.category === 'genre').map(t => t.value);
  const genres2 = onboarding2.filter(t => t.category === 'genre').map(t => t.value);
  const commonGenres = genres1.filter(g => genres2.includes(g));

  const genreScore = Math.min((commonGenres.length / Math.max(genres1.length, 1)) * 100, 100) * 0.2;

  // Final Aggregation
  const finalScore = Math.round(mediaScore + styleScore + genreScore);

  let label: CompatibilityScore['label'] = 'Low';
  if (finalScore >= 80) label = 'Cinematic Twin';
  else if (finalScore >= 60) label = 'High';
  else if (finalScore >= 30) label = 'Moderate';

  return {
    score: finalScore,
    label,
    commonMedia: commonMediaDetails,
    commonStyles
  };
}
