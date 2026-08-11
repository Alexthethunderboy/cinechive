import { UniversalMedia, UniversalTransformer } from './UniversalTransformer';
import type { TMDBSearchResult } from './tmdb';

export class AnimationFetcher {
  /**
   * Fetches Trending Animation (Western/Global) from TMDB
   * Uses the discover endpoint locked to with_genres=16 (Animation)
   */
  static async getTrendingAnimation(page: number = 1): Promise<{ results: UniversalMedia[], totalPages: number }> {
    // We construct a discover URL that sorts by popularity and restricts to genre 16
    const url = new URL('https://api.themoviedb.org/3/discover/movie');
    url.searchParams.append('api_key', process.env.TMDB_API_KEY || '');
    url.searchParams.append('with_genres', '16'); // Animation genre ID
    url.searchParams.append('sort_by', 'popularity.desc');
    // We only want primarily animation studios/content, usually filtering out Anime since AniList handles it.
    // TMDB doesn't cleanly separate Anime from western animation, but excluding Japanese (ja) original language heavily filters it.
    url.searchParams.append('without_original_language', 'ja');
    url.searchParams.append('page', String(page));

    // Wait for the shared TMDB rate limiter
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      throw new Error(`TMDB Animation fetch failed: ${res.status}`);
    }
    const data: TMDBSearchResult = await res.json();

    return {
      results: data.results.map((item) => UniversalTransformer.fromTMDB(item, 'movie')),
      totalPages: data.total_pages,
    };
  }
}
