import { UniversalMedia, UniversalTransformer } from './UniversalTransformer';
import type { TMDBSearchResult } from './tmdb';

export class DocumentaryFetcher {
  /**
   * Fetches Trending Documentaries from TMDB
   * Uses the discover endpoint locked to with_genres=99 (Documentary)
   */
  static async getTrendingDocumentaries(page: number = 1): Promise<{ results: UniversalMedia[], totalPages: number }> {
    const url = new URL('https://api.themoviedb.org/3/discover/movie');
    url.searchParams.append('api_key', process.env.TMDB_API_KEY || '');
    url.searchParams.append('with_genres', '99'); // Documentary genre ID
    url.searchParams.append('sort_by', 'popularity.desc');
    url.searchParams.append('page', String(page));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      throw new Error(`TMDB Documentary fetch failed: ${res.status}`);
    }
    const data: TMDBSearchResult = await res.json();

    return {
      results: data.results.map((item) => UniversalTransformer.fromTMDB(item, 'movie')),
      totalPages: data.total_pages,
    };
  }
}
