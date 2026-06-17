'use server';

import { UniversalMedia, UniversalTransformer } from './api/UniversalTransformer';
import { MediaFetcher } from './api/MediaFetcher';
import { AniListFetcher } from './api/anilist';
import { AnimationFetcher } from './api/AnimationFetcher';
import { DocumentaryFetcher } from './api/DocumentaryFetcher';
import { getUpcomingMovies, getUpcomingTv, getUpcomingAnimations, getFutureHorizonsMovie } from './api/tmdb';
import { getNextSeason } from './date-utils';

/**
 * Trending Feed Action
 */
export async function getTrendingFeedAction(type: 'movie' | 'tv', page: number = 1): Promise<{ results: UniversalMedia[], totalPages: number }> {
    return MediaFetcher.getTrendingFeed(type, page);
}

/**
 * Anime Feed Action (Trending from AniList)
 */
export async function getAnimeFeedAction(page: number = 1): Promise<{ results: UniversalMedia[], hasNextPage: boolean }> {
  try {
    const data = await AniListFetcher.getTrendingAnime(page);
    const results = data.media.map((item: any) => UniversalTransformer.fromAniList(item));
    
    return {
      results,
      hasNextPage: data.pageInfo.hasNextPage
    };
  } catch (error) {
    console.error("Anime feed error:", error);
    return { results: [], hasNextPage: false };
  }
}

/**
 * Animation Feed Action (Trending from TMDB)
 */
export async function getAnimationFeedAction(page: number = 1): Promise<{ results: UniversalMedia[], totalPages: number }> {
  try {
    return AnimationFetcher.getTrendingAnimation(page);
  } catch (error) {
    console.error("Animation feed error:", error);
    return { results: [], totalPages: 0 };
  }
}

/**
 * Documentary Feed Action (Trending from TMDB)
 */
export async function getDocumentaryFeedAction(page: number = 1): Promise<{ results: UniversalMedia[], totalPages: number }> {
  try {
    return DocumentaryFetcher.getTrendingDocumentaries(page);
  } catch (error) {
    console.error("Documentary feed error:", error);
    return { results: [], totalPages: 0 };
  }
}

/**
 * Release Radar Action
 */
export async function getReleaseRadarAction(): Promise<UniversalMedia[]> {
  try {
    const { season, year } = getNextSeason();
    // Fetch multiple sources to get a broad "All Time" reach
    const [upcoming, anime] = await Promise.all([
      getUpcomingFeedAction(),
      AniListFetcher.getUpcomingAnime(season, year, 1, 50) // Increase perPage for upcoming anime
    ]);
    
    const animeTransformed = anime.media.map((item: any) => UniversalTransformer.fromAniList(item));
    
    // We could also fetch trending TV/Movies as fallback if upcoming is too sparse, 
    // but the user specifically asked for upcoming.
    
    const combinedRaw = [
      ...upcoming.movies,
      ...upcoming.tv,
      ...upcoming.animation,
      ...animeTransformed
    ].filter(item => !!item.releaseDate);

    // Deduplicate by ID
    const uniqueMap = new Map<string, UniversalMedia>();
    combinedRaw.forEach(item => {
      uniqueMap.set(item.id, item);
    });

    const combined = Array.from(uniqueMap.values())
     .sort((a, b) => new Date(a.releaseDate!).getTime() - new Date(b.releaseDate!).getTime());
      
    return combined;
  } catch (error) {
    console.error("Release Radar error:", error);
    return [];
  }
}

/**
 * Upcoming & Future Horizons Actions
 */
export async function getUpcomingFeedAction() {
  const [movies, tv, animation] = await Promise.all([
    getUpcomingMovies(),
    getUpcomingTv(),
    getUpcomingAnimations()
  ]);

  return {
    movies: movies.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'movie')),
    tv: tv.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'tv')),
    animation: animation.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'movie'))
  };
}

export async function getFutureHorizonsAction(year: number) {
  const movies = await getFutureHorizonsMovie(year);
  return movies.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'movie'));
}
import { createClient } from '@/lib/supabase/server';

export async function getCommunityFeed(friendsOnly = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let followingIds: string[] = [];
  let followerIds: string[] = [];

  if (friendsOnly && user) {
    const { data: follows } = await (supabase
      .from('follows'))
      .select('following_id')
      .eq('follower_id', user.id);

    followingIds = (follows ?? []).map((f: any) => f.following_id);

    // If user follows nobody, return empty rather than falling back to global
    if (followingIds.length === 0) {
      return { feed: [], preferredStyles: [], isEmpty: true, hadError: false };
    }
  }

  if (user && !friendsOnly) {
    const [followingRes, followersRes] = await Promise.all([
      (supabase
        .from('follows'))
        .select('following_id')
        .eq('follower_id', user.id),
      (supabase
        .from('follows'))
        .select('follower_id')
        .eq('following_id', user.id),
    ]);
    followingIds = (followingRes.data ?? []).map((f: any) => f.following_id);
    followerIds = (followersRes.data ?? []).map((f: any) => f.follower_id);
  }

  let query = (supabase
    .from('feed_activity'))
    .select('*')
    .eq('activity_type', 'dispatch')
    .order('created_at', { ascending: false })
    .limit(40);

  if (friendsOnly && followingIds.length > 0) {
    query = query.in('user_id', followingIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Community fetch failed:", error.message || error);
    return { feed: [], preferredStyles: [], isEmpty: false, hadError: true };
  }

  const rawFeed = data as any[];
  const activityIds = rawFeed.map(p => p.id);

  // Fetch reactions, comments, and reposts in bulk
  const [reactionsRes, userReactionsRes, commentsRes, repostsRes, userRepostsRes] = await Promise.all([
    (supabase
      .from('reactions'))
      .select('activity_id')
      .in('activity_id', activityIds),
    user ? (supabase
      .from('reactions'))
      .select('activity_id')
      .eq('user_id', user.id)
      .in('activity_id', activityIds) : Promise.resolve({ data: [] }),
    (supabase
      .from('comments'))
      .select('id, activity_id, body, created_at, profiles:user_id (username)')
      .in('activity_id', activityIds)
      .order('created_at', { ascending: false }),
    (supabase
      .from('activity_reposts'))
      .select('activity_id, user_id')
      .in('activity_id', activityIds),
    user ? (supabase
      .from('activity_reposts'))
      .select('activity_id')
      .eq('user_id', user.id)
      .in('activity_id', activityIds) : Promise.resolve({ data: [] }),
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

  const repostCounts: Record<string, number> = {};
  const repostedByFollowingCounts: Record<string, number> = {};
  const repostPreviewUsernames: Record<string, string[]> = {};
  const followingSet = new Set(followingIds);
  const followerSet = new Set(followerIds);

  (repostsRes.data || []).forEach((r: any) => {
    repostCounts[r.activity_id] = (repostCounts[r.activity_id] || 0) + 1;
    if (followingSet.has(r.user_id)) {
      repostedByFollowingCounts[r.activity_id] = (repostedByFollowingCounts[r.activity_id] || 0) + 1;
    }
  });

  const userReposts = new Set((userRepostsRes.data || []).map((r: any) => r.activity_id));

  // Map social data to feed
  const feedWithSocial = rawFeed.map(post => ({
    ...post,
    reaction_count: reactionCounts[post.id] || 0,
    has_reacted: userReactions.has(post.id),
    comment_count: commentCounts[post.id] || 0,
    recent_comments: commentsByActivity[post.id] || [],
    repost_count: repostCounts[post.id] || 0,
    reposted_by_following_count: repostedByFollowingCounts[post.id] || 0,
    has_reposted: userReposts.has(post.id),
    reposted_by_usernames: repostPreviewUsernames[post.id] || [],
    follows_you: followerSet.has(post.user_id),
    is_mutual: followerSet.has(post.user_id) && followingSet.has(post.user_id),
  }));

  let preferredStyles: string[] = [];

  // Personalization: soft-sort by user's preferred cinematic styles
  if (user) {
    const { data: tastes } = await (supabase
      .from('user_onboarding_tastes'))
      .select('value')
      .eq('user_id', user.id)
      .in('category', ['style', 'genre']);

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

  return { feed: feedWithSocial, preferredStyles, isEmpty: false, hadError: false };
}
