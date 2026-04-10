'use server';

import { createClient } from '@/lib/supabase/server';
import { UniversalMedia, UniversalTransformer } from './api/UniversalTransformer';
import { MediaFetcher } from './api/MediaFetcher';
import { isAfter, subDays, startOfToday } from 'date-fns';

export interface CommunityNotification {
  id: string;
  type: 'release' | 'recommendation' | 'activity';
  media: UniversalMedia;
  message: string;
  timestamp: string;
}

export interface UserActivityItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  title: string;
  poster_url: string | null;
  media_type: string;
  media_id: string;
  vibe: string | null;
  created_at: string;
  activity_type: 'entry' | 're_archive' | 'echo';
  content?: string | null;
}

/**
 * Fetch algorithmic notifications based on user interests.
 * Focuses on:
 * 1. Recently released items from user reminders.
 * 2. New releases in user's favorite genres (from vault).
 */
export async function getAlgorithmicNotifications(): Promise<{ notifications: CommunityNotification[]; topInterests: string[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notifications: [], topInterests: [] };

  // 1. Get User Reminders and Existing Entries to avoid duplicates
  const [remindersRes, entriesRes] = await Promise.all([
    (supabase.from('user_reminders') as any).select('media_id, media_type').eq('user_id', user.id),
    (supabase.from('media_entries') as any).select('external_id, media_type').eq('user_id', user.id)
  ]);

  const reminders = remindersRes.data;
  const existingEntries = new Set(entriesRes.data?.map((e: any) => `${e.media_type}:${e.external_id}`));

  // 2. Get User's Top Classifications from Vault (with labels)
  const { data: vaultEntries } = await (supabase
    .from('media_entries') as any)
    .select('mood_tag_id, mood_tags(label)')
    .eq('user_id', user.id);

  // 3. Get Onboarding Tastes (Genres, Movies, Creators)
  const { data: onboardingTastes } = await (supabase
    .from('user_onboarding_tastes') as any)
    .select('value, category, display_name')
    .eq('user_id', user.id);

  // Aggregate Interests
  const interests = new Map<string, number>();

  // Vault influence (stronger weight because it's actively collected)
  vaultEntries?.forEach((e: any) => {
    const label = e.mood_tags?.label?.toLowerCase();
    if (label) interests.set(label, (interests.get(label) || 0) + 15);
  });

  // Onboarding Genre influence
  onboardingTastes?.filter((t: any) => t.category === 'genre').forEach((t: any) => {
    // We use the display_name for matching against movie genre names
    const genre = (t.display_name || t.value).toLowerCase();
    
    // Normalize "Sci-Fi" to "Science Fiction" for TMDB matching
    const normalized = genre === 'sci-fi' ? 'science fiction' : genre;
    
    interests.set(normalized, (interests.get(normalized) || 0) + 30); // Higher weight for genre pivot
  });

  // Trending items fetch
  const [trendingMovies, trendingTv] = await Promise.all([
    MediaFetcher.getTrendingFeed('movie', 1),
    MediaFetcher.getTrendingFeed('tv', 1),
  ]);

  const allMedia = [...trendingMovies.results, ...trendingTv.results];
  const today = startOfToday();
  const fourteenDaysAgo = subDays(today, 14);

  const notifications: CommunityNotification[] = allMedia
    .filter(m => {
      if (!m.releaseDate) return false;
      
      // Filter out items already in the user's library
      if (existingEntries.has(`${m.type}:${m.id}`)) return false;

      const rDate = new Date(m.releaseDate);
      return rDate <= today && rDate >= fourteenDaysAgo;
    })
    .map(m => {
      let score = 0;
      
      // Match against aggregated interests
      if (m.classification) {
        const cls = m.classification.toLowerCase();
        score += interests.get(cls) || 0;
      }

      // Match against genres
      m.genres?.forEach((g: string) => {
        const gen = g.toLowerCase();
        score += interests.get(gen) || 0;
      });

      // Special boost for reminders
      if (reminders?.some((r: any) => r.media_id === m.id.toString())) {
        score += 100;
      }

      return {
        id: `community-${m.id}`,
        type: 'release' as const,
        media: m,
        message: score >= 50 ? `Based on your movie style: ${m.displayTitle}` : `Released now: ${m.displayTitle}`,
        timestamp: m.releaseDate || new Date().toISOString(),
        score,
      };
    });

  // Sort by Score, then Recency
  const finalNotifications = notifications
    .sort((a, b) => {
      const scoreA = (a as any).score || 0;
      const scoreB = (b as any).score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .map(({ score, ...notif }: any) => notif)
    .slice(0, 10);

  // Get top 3 interests for UI display
  const topInterests = Array.from(interests.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  return { notifications: finalNotifications, topInterests };
}

/**
 * Fetch and format the user's own activity history from the feed_activity view.
 */
export async function getUserActivityHistory(): Promise<UserActivityItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase
    .from('feed_activity')
    .select('*')
    .eq('user_id', user.id)
    .eq('activity_type', 'dispatch')
    .order('created_at', { ascending: false })
    .limit(30) as any);

  if (error) {
    console.error('Failed to fetch user activity history:', error);
    return [];
  }

  return (data as UserActivityItem[]) || [];
}
