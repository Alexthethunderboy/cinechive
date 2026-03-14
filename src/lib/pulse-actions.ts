'use server';

import { createClient } from '@/lib/supabase/server';
import { UniversalMedia, UniversalTransformer } from './api/UniversalTransformer';
import { MediaFetcher } from './api/MediaFetcher';
import { isAfter, subDays, startOfToday } from 'date-fns';

export interface PulseNotification {
  id: string;
  type: 'release' | 'recommendation';
  media: UniversalMedia;
  message: string;
  timestamp: string;
}

/**
 * Fetch Algorithmic Notifications for the Gold Bell
 * Focuses on:
 * 1. Recently released items from user reminders.
 * 2. New releases in user's favorite genres (from vault).
 */
export async function getAlgorithmicNotifications(): Promise<PulseNotification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Get User Reminders
  const { data: reminders } = await (supabase
    .from('user_reminders') as any)
    .select('media_id, media_type')
    .eq('user_id', user.id);

  // 2. Get User Likes (Vault) to derive genres
  const { data: vaultEntries } = await (supabase
    .from('media_entries') as any)
    .select('media_type, external_id')
    .eq('user_id', user.id);

  // For this MVP prototype, we'll fetch a mix of "Trending Today" (Released)
  // and check against reminders or generic high-quality releases.
  
  // Fetch Trending Movie/TV/Anime that are OUT
  const [trendingMovies, trendingTv] = await Promise.all([
    MediaFetcher.getTrendingFeed('movie', 1),
    MediaFetcher.getTrendingFeed('tv', 1),
  ]);

  const allMedia = [...trendingMovies.results, ...trendingTv.results];
  
  // Filter for items released in the last 14 days or exactly upcoming/out today
  const today = startOfToday();
  const fourteenDaysAgo = subDays(today, 14);

  const notifications: PulseNotification[] = allMedia
    .filter(m => {
      if (!m.releaseDate) return false;
      const rDate = new Date(m.releaseDate);
      return rDate <= today && rDate >= fourteenDaysAgo;
    })
    .map(m => ({
      id: `pulse-${m.id}`,
      type: 'release',
      media: m,
      message: `Available now: ${m.displayTitle}`,
      timestamp: m.releaseDate || new Date().toISOString(),
    }));

  // Sort by most recent
  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
}
