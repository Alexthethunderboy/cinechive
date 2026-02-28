'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getTrending, searchMedia, enrichWithDirector, getMovieDetails } from './api/tmdb';
import { ClassificationName, CLASSIFICATION_COLORS } from './design-tokens';
import { mapTMDBToUnified, UnifiedMedia, DetailedMedia } from './api/mapping';
import { MediaFetcher } from './api/MediaFetcher';

/**
 * Unified Search Server Action
 */
export async function unifiedSearchAction(query: string, type: 'all' | 'video' = 'all'): Promise<UnifiedMedia[]> {
  if (!query) return [];

  const promises: Promise<any>[] = [];

  if (type === 'all' || type === 'video') {
    promises.push(searchMedia(query).catch(() => ({ results: [] })));
  }

  const results = await Promise.all(promises);
  let globalResults: UnifiedMedia[] = results[0].results.map(mapTMDBToUnified);

  globalResults = globalResults.slice(0, 20);
  globalResults = await enrichWithDirector(globalResults);

  return globalResults;
}

/**
 * Archive Media Entry
 */
export async function archiveMediaAction(data: {
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string | null;
  classification: ClassificationName;
  comment?: string;
  rating?: number;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required to collect film.");

  // Resolve vibe string to mood_tag_id
  const { data: mood } = await (supabase
    .from('mood_tags')
    .select('id')
    .eq('label', data.classification)
    .single() as any);

  const { error } = await (supabase.from('media_entries') as any).insert({
    user_id: user.id,
    external_id: data.mediaId,
    media_type: data.mediaType as any,
    title: data.title,
    poster_url: data.posterUrl,
    mood_tag_id: mood?.id || null,
    notes: data.comment || null,
    rating: data.rating || null,
    is_vault: true,
  });

  if (error) {
    console.error("Collection failed:", error);
    throw new Error(error.message);
  }

  revalidatePath('/pulse');
  revalidatePath('/vault');
  return { success: true };
}

/**
 * Fetch Social Pulse Feed
 */
export async function getPulseFeed() {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('feed_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20) as any);

  if (error) {
    console.error("Pulse fetch failed:", error.message || error);
    return [];
  }

  return data as any[];
}

/**
 * Fetch Vault Entries
 */
export async function getVaultEntries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase
    .from('media_entries')
    .select(`
      *,
      mood_tags (label)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as any);

  if (error) {
    console.error("Vault fetch failed:", error);
    return [];
  }

  return (data as any[]).map(item => ({
    ...item,
    media_id: item.external_id,
    classification: item.mood_tags?.label,
  }));
}

/**
 * Re-Archive Action
 */
export async function reArchiveMediaAction(data: {
  originalEntryId: string;
  comment?: string;
  classification?: ClassificationName;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  let moodTagId: number | null = null;
  if (data.classification) {
    const { data: mood } = await (supabase
      .from('mood_tags')
      .select('id')
      .eq('label', data.classification)
      .single() as any);
    moodTagId = mood?.id || null;
  }

  const { error } = await (supabase.from('re_archives') as any).insert({
    user_id: user.id,
    original_entry_id: data.originalEntryId,
    mood_tag_id: moodTagId,
    comment: data.comment || null,
  });

  if (error) {
    console.error("Re-archive failed:", error);
    throw new Error(error.message);
  }

  revalidatePath('/pulse');
  return { success: true };
}

/**
 * Profile Actions
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await (supabase
    .from('profiles')
    .select('*')
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
    .eq('media_type', mediaType)
    .maybeSingle() as any);

  if (error || !data) return null;

  return {
    ...data,
    classification: data.mood_tags?.label,
  };
}

/**
 * Advanced Search & Discovery Actions
 */
import { SearchService } from './services/SearchService';

export async function globalSearchAction(query: string, options?: { mood?: string; hiddenGems?: boolean }) {
  return SearchService.globalSearch(query, options);
}

export async function getDeepEntityAction(id: string, type: 'movie' | 'tv') {
  return SearchService.getDeepEntityDetails(id, type);
}

export async function getPersonCatalogAction(personId: string) {
  return SearchService.getCatalogForPerson(personId);
}

/**
 * Reviews & Social
 */
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
    .eq('media_type', mediaType)
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
    .eq('media_type', mediaType)
    .in('user_id', followingIds)
    .not('notes', 'is', null)
    .order('created_at', { ascending: false }) as any);

  if (error) {
    console.error("Failed to fetch friend reviews:", error);
    return [];
  }

  return data as any[];
}

/**
 * Dashboard Actions
 */
import { DeepDataService } from './services/DeepDataService';

export async function getRandomTriviaAction() {
  const entries = await getVaultEntries();
  const movies = entries.filter(e => e.media_type === 'movie');
  
  if (movies.length === 0) return null;
  
  const randomMovie = movies[Math.floor(Math.random() * movies.length)];
  
  try {
    const details = await getMovieDetails(parseInt(randomMovie.media_id));
    const imdbId = details.external_ids?.imdb_id;
    
    if (!imdbId) return null;
    
    const trivia = await DeepDataService.fetchTrivia(randomMovie.media_id, imdbId);
    if (trivia.length === 0) return null;
    
    const randomTrivia = trivia[Math.floor(Math.random() * trivia.length)];
    
    return {
      movieTitle: randomMovie.title,
      trivia: randomTrivia,
      mediaId: randomMovie.media_id,
      mediaType: randomMovie.media_type
    };
  } catch (error) {
    console.error("Failed to fetch random trivia:", error);
    return null;
  }
}

export async function getCuratedCollectionsAction() {
  return MediaFetcher.getCuratedCollections();
}

