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
 * Archive Media Entry (Upsert: Create or Update)
 */
export async function archiveMediaAction(data: {
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string | null;
  classification: ClassificationName;
  comment?: string;
  rating?: number;
  isVault?: boolean;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required to collect film." };

  // Resolve vibe string to mood_tag_id
  const { data: mood } = await (supabase
    .from('mood_tags')
    .select('id')
    .eq('label', data.classification)
    .single() as any);

  // Use upsert with onConflict for better reliability
  const { error } = await (supabase.from('media_entries') as any).upsert({
    user_id: user.id,
    external_id: data.mediaId,
    media_type: data.mediaType as any,
    title: data.title,
    poster_url: data.posterUrl,
    mood_tag_id: mood?.id || null,
    notes: data.comment || null,
    rating: data.rating || null,
    is_vault: data.isVault !== undefined ? data.isVault : true,
    updated_at: new Date().toISOString(),
  }, { 
    onConflict: 'user_id, external_id' 
  });

  if (error) {
    console.error("Collection failed:", error);
    return { error: error.message };
  }

  // Phase 3 Social Sync: Update global community ratings and reviews
  try {
    const socialPromises: Promise<any>[] = [];
    
    if (data.rating) {
      socialPromises.push(
        (supabase.from('media_ratings') as any).upsert({
          user_id: user.id,
          media_id: data.mediaId,
          media_type: data.mediaType,
          rating: data.rating,
          updated_at: new Date().toISOString()
        })
      );
    }

    if (data.comment) {
      socialPromises.push(
        (supabase.from('media_reviews') as any).upsert({
          user_id: user.id,
          media_id: data.mediaId,
          media_type: data.mediaType,
          content: data.comment,
          updated_at: new Date().toISOString()
        })
      );
    }

    if (socialPromises.length > 0) {
      await Promise.all(socialPromises);
    }
  } catch (socialError) {
    console.error("Social sync failed:", socialError);
    // Non-blocking error: the library entry is saved anyway.
  }

  revalidatePath('/community');
  revalidatePath('/vault');
  revalidatePath('/activity');
  revalidatePath(`/media/${data.mediaType}/${data.mediaId}`);
  return { success: true };
}

/**
 * Remove Media Entry from Library
 */
export async function removeMediaEntryAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await (supabase
    .from('media_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('external_id', mediaId) as any);

  if (error) {
    console.error("Removal failed:", error);
    return { error: error.message };
  }

  revalidatePath('/vault');
  revalidatePath('/activity');
  revalidatePath(`/media/${mediaType}/${mediaId}`);
  return { success: true };
}

/**
 * Toggle Archive Media (Legacy support or quick toggle)
 */
export async function toggleArchiveMediaAction(data: {
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { data: existing } = await (supabase
    .from('media_entries')
    .select('id, is_vault')
    .eq('user_id', user.id)
    .eq('external_id', data.mediaId)
    .maybeSingle() as any);

  if (existing) {
    const { error } = await (supabase.from('media_entries') as any)
      .update({ is_vault: !existing.is_vault, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    
    if (error) return { error: error.message };
    revalidatePath('/vault');
    return { success: true, status: !existing.is_vault ? 'added' : 'removed' };
  } else {
    // Insert new entry as vault
    const { error } = await (supabase.from('media_entries') as any).insert({
      user_id: user.id,
      external_id: data.mediaId,
      media_type: data.mediaType as any,
      title: data.title,
      poster_url: data.posterUrl,
      is_vault: true,
    });

    if (error) return { error: error.message };
    revalidatePath('/vault');
    revalidatePath('/activity');
    return { success: true, status: 'added' };
  }
}

export async function getIsInVaultAction(mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await (supabase
    .from('media_entries')
    .select('is_vault')
    .eq('user_id', user.id)
    .eq('external_id', mediaId)
    .maybeSingle() as any);

  return !!data?.is_vault;
}

/**
 * Fetch Social Community Feed.
 * @param friendsOnly - When true, returns only posts from users the current user follows.
 */
export async function getCommunityFeed(friendsOnly = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let followingIds: string[] = [];

  if (friendsOnly && user) {
    const { data: follows } = await (supabase
      .from('follows') as any)
      .select('following_id')
      .eq('follower_id', user.id);

    followingIds = (follows ?? []).map((f: any) => f.following_id);

    // If user follows nobody, return empty rather than falling back to global
    if (followingIds.length === 0) {
      return { feed: [], preferredStyles: [], isEmpty: true };
    }
  }

  let query = (supabase
    .from('feed_activity') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  if (friendsOnly && followingIds.length > 0) {
    query = query.in('user_id', followingIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Community fetch failed:", error.message || error);
    return { feed: [], preferredStyles: [], isEmpty: false };
  }

  const rawFeed = data as any[];
  const activityIds = rawFeed.map(p => p.id);

  // Fetch reactions and comments in bulk
  const [reactionsRes, userReactionsRes, commentsRes] = await Promise.all([
    (supabase
      .from('reactions') as any)
      .select('activity_id')
      .in('activity_id', activityIds),
    user ? (supabase
      .from('reactions') as any)
      .select('activity_id')
      .eq('user_id', user.id)
      .in('activity_id', activityIds) : Promise.resolve({ data: [] }),
    (supabase
      .from('comments') as any)
      .select('id, activity_id, body, created_at, profiles:user_id (username)')
      .in('activity_id', activityIds)
      .order('created_at', { ascending: false })
  ]);

  const reactionCounts: Record<string, number> = {};
  (reactionsRes.data || []).forEach((r: any) => {
    reactionCounts[r.activity_id] = (reactionCounts[r.activity_id] || 0) + 1;
  });

  const userReactions = new Set((userReactionsRes.data || []).map((r: any) => r.activity_id));
  
  const commentsByActivity: Record<string, any[]> = {};
  const commentCounts: Record<string, number> = {};
  
  (commentsRes.data || []).forEach((c: any) => {
    if (!commentsByActivity[c.activity_id]) {
      commentsByActivity[c.activity_id] = [];
      commentCounts[c.activity_id] = 0;
    }
    commentCounts[c.activity_id]++;
    if (commentsByActivity[c.activity_id].length < 2) {
      commentsByActivity[c.activity_id].push({
        id: c.id,
        body: c.body,
        username: c.profiles?.username || 'user',
      });
    }
  });

  for(const actId in commentsByActivity) {
    commentsByActivity[actId].reverse();
  }

  // Map social data to feed
  const feedWithSocial = rawFeed.map(post => ({
    ...post,
    reaction_count: reactionCounts[post.id] || 0,
    has_reacted: userReactions.has(post.id),
    comment_count: commentCounts[post.id] || 0,
    recent_comments: commentsByActivity[post.id] || []
  }));

  let preferredStyles: string[] = [];

  // Personalization: soft-sort by user's preferred cinematic styles
  if (user) {
    const { data: tastes } = await (supabase
      .from('user_onboarding_tastes') as any)
      .select('value')
      .eq('user_id', user.id)
      .eq('category', 'style');

    if (tastes && tastes.length > 0) {
      preferredStyles = tastes.map((t: any) => t.value);

      feedWithSocial.sort((a, b) => {
        const aMatch = preferredStyles.includes(a.vibe);
        const bMatch = preferredStyles.includes(b.vibe);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }
  }

  return { feed: feedWithSocial, preferredStyles, isEmpty: false };
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
    id: item.id,
    sourceId: item.external_id,
    source: 'tmdb', // Defaulting to tmdb as most vault items are tmdb-based, or add source column if exists
    type: item.media_type,
    displayTitle: item.title,
    posterUrl: item.poster_url,
    releaseYear: item.year,
    classification: item.mood_tags?.label || 'Atmospheric',
  }));
}

/**
 * Re-Archive Action
 */
export async function reArchiveMediaAction(data: {
  originalEntryId: string;
  type?: 'entry' | 'dispatch';
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

  const payload: any = {
    user_id: user.id,
    mood_tag_id: moodTagId,
    comment: data.comment || null,
  };

  if (data.type === 'dispatch') {
    payload.original_dispatch_id = data.originalEntryId;
  } else {
    payload.original_entry_id = data.originalEntryId;
  }

  const { error } = await (supabase.from('re_archives') as any).insert(payload);

  if (error) {
    console.error("Re-archive failed:", error);
    throw new Error(error.message);
  }

  revalidatePath('/community');
  return { success: true };
}

/**
 * Echo Trivia Action
 */
export async function echoTriviaAction(data: {
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
  posterUrl: string | null;
  triviaId: string;
  triviaText: string;
  category?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await (supabase.from('echoes') as any).insert({
    user_id: user.id,
    media_id: data.mediaId,
    media_type: data.mediaType,
    media_title: data.mediaTitle,
    poster_url: data.posterUrl,
    trivia_id: data.triviaId,
    trivia_text: data.triviaText,
    category: data.category || 'general'
  });

  if (error) {
    console.error("Echo failed:", error);
    throw new Error(error.message);
  }

  revalidatePath('/community');
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
    .select('id, username, display_name, avatar_url, bio, onboarding_completed, created_at')
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

export async function getSeasonEpisodesAction(tvId: number, seasonNumber: number) {
  return SearchService.getSeason(tvId, seasonNumber);
}

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

export async function getStylePageAction(slug: string, page: number = 1) {
  return MediaFetcher.getByStyle(slug, page);
}

export async function getGenrePageAction(genreId: number, type: 'movie' | 'tv' = 'movie', page: number = 1) {
  return MediaFetcher.getByGenre(genreId, type, page);
}

export async function getSelectionPageAction(slug: string, page: number = 1) {
  return MediaFetcher.getBySelection(slug, page);
}

/**
 * Collection Actions
 */

export async function createCollectionAction(data: {
  title: string;
  description?: string;
  isPublic?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { data: collection, error } = await (supabase.from('collections') as any).insert({
    user_id: user.id,
    title: data.title,
    description: data.description || null,
    is_public: data.isPublic || false,
  }).select().single();

  if (error) {
    console.error("Failed to create collection:", error);
    throw new Error(error.message);
  }

  revalidatePath('/vault');
  return collection;
}

export async function deleteCollectionAction(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await (supabase.from('collections') as any)
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error("Failed to delete collection:", error);
    throw new Error(error.message);
  }

  revalidatePath('/vault');
  return { success: true };
}

export async function addMediaToCollectionAction(collectionId: string, media: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  // First verify ownership of the collection
  const { data: collection } = await (supabase.from('collections') as any)
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();

  if (!collection) throw new Error("Collection not found or access denied.");

  const { error } = await (supabase.from('collection_items') as any).upsert({
    collection_id: collectionId,
    media_id: media.id,
    media_type: media.type,
    title: media.displayTitle || media.title,
    poster_url: media.posterUrl,
    year: media.releaseYear,
  });

  if (error) {
    console.error("Failed to add to collection:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/vault/collections/${collectionId}`);
  return { success: true };
}

export async function removeMediaFromCollectionAction(collectionId: string, mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await (supabase.from('collection_items') as any)
    .delete()
    .eq('collection_id', collectionId)
    .eq('media_id', mediaId);

  if (error) {
    console.error("Failed to remove from collection:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/vault/collections/${collectionId}`);
  return { success: true };
}

export async function getUserCollectionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase.from('collections') as any)
    .select(`*`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch user collections:", error);
    return [];
  }

  return data;
}

export async function getCollectionDetailsAction(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const query = (supabase.from('collections') as any)
    .select(`
      *,
      collection_items (*)
    `)
    .eq('id', collectionId);

  // If not owner, must be public (token logic handled separately if needed)
  const { data: collection, error } = await query.single();

  if (error || !collection) {
    console.error("Failed to fetch collection details:", error);
    return null;
  }

  // Security check: if not owner and not public, deny (unless sharing logic applies)
  if (collection.user_id !== user?.id && !collection.is_public) {
    // Check if it's being accessed via a share token (this would be in the public route)
    return null;
  }

  return collection;
}

export async function getSharedCollectionAction(shareToken: string) {
  const supabase = await createClient();
  
  const { data: collection, error } = await (supabase.from('collections') as any)
    .select(`
      *,
      collection_items (*),
      profiles (username, avatar_url)
    `)
    .eq('share_token', shareToken)
    .single();

  if (error || !collection) {
    console.error("Failed to fetch shared collection:", error);
    return null;
  }

  return collection;
}
