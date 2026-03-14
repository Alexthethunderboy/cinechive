'use server';

import { UniversalMedia, UniversalTransformer } from './api/UniversalTransformer';
import { MediaFetcher } from './api/MediaFetcher';
import { AniListFetcher } from './api/anilist';
import { AnimationFetcher } from './api/AnimationFetcher';
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
