import { UniversalMedia, UniversalTransformer } from './UniversalTransformer';

export type FeedEntity = UniversalMedia;

export class MediaFetcherError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = 'MediaFetcherError';
    this.status = options?.status;
    this.code = options?.code;
  }
}

// Simple rate limiter implementation
class RateLimiter {
  private queue: (() => void)[] = [];
  private tokens: number;
  private maxTokens: number;
  private refillRateMs: number;

  constructor(maxRequests: number, perTimeWindowMs: number) {
    this.maxTokens = maxRequests;
    this.tokens = maxRequests;
    this.refillRateMs = perTimeWindowMs / maxRequests;

    // Start background token refill
    setInterval(() => {
      if (this.tokens < this.maxTokens) {
        this.tokens++;
        this.processQueue();
      }
    }, this.refillRateMs);
  }

  private processQueue() {
    if (this.tokens > 0 && this.queue.length > 0) {
      this.tokens--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }

  async acquireToken(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }
}

// 40 requests per 10 seconds is the TMDB limit
const tmdbRateLimiter = new RateLimiter(38, 10000); 

export class MediaFetcher {
  private static TMDB_BASE = 'https://api.themoviedb.org/3';
  private static tmdbAuthWarningShown = false;
  
  private static getUrl(path: string, params: Record<string, any> = {}) {
    const url = new URL(`${this.TMDB_BASE}${path}`);
    url.searchParams.append('api_key', process.env.TMDB_API_KEY || '');
    Object.entries(params).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });
    return url.toString();
  }

  private static async fetchWithRateLimit(url: string) {
    await tmdbRateLimiter.acquireToken();
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      const errorText = await res.text();
      if (res.status === 401) {
        if (!this.tmdbAuthWarningShown) {
          console.warn('TMDB API key is invalid or missing. Media search/features are temporarily unavailable.');
          this.tmdbAuthWarningShown = true;
        }
        throw new MediaFetcherError('TMDB auth failed', { status: 401, code: 'TMDB_AUTH' });
      }
      console.error(`TMDB fetch failed [${res.status}]: ${errorText}`);
      throw new MediaFetcherError(`TMDB fetch failed: ${res.status}`, { status: res.status, code: 'TMDB_FETCH' });
    }
    return res.json();
  }

  static async getTrendingFeed(type: 'movie' | 'tv', page: number = 1): Promise<{ results: UniversalMedia[], totalPages: number }> {
    const url = this.getUrl(`/trending/${type}/day`, { page });
    const trendingData = await this.fetchWithRateLimit(url);
    
    // Fetch deep details for each item concurrently
    const deepFetchPromises = trendingData.results.map((item: any) => this.getDeepDetails(item.id, type));
    const detailedResults = await Promise.all(deepFetchPromises);

    // Filter out any failed deep fetches
    const validResults = detailedResults.filter(Boolean) as UniversalMedia[];

    return {
      results: validResults,
      totalPages: trendingData.total_pages,
    };
  }

  // Canonical selection slugs and their TMDB discover params
  static readonly SELECTIONS: { slug: string; title: string; description: string; params: Record<string, any> }[] = [
    {
      slug: 'noir-shadows',
      title: 'Noir Shadows',
      description: 'Hard-boiled crime, moody atmosphere, and grey morality.',
      params: { with_genres: '80,9648,53', 'vote_average.gte': 7 }
    },
    {
      slug: 'neon-dreams',
      title: 'Neon Dreams',
      description: 'Vibrant Sci-Fi explorations and futuristic aesthetics.',
      params: { with_genres: '878,28', 'vote_average.gte': 7 }
    },
    {
      slug: 'hidden-gems',
      title: 'Hidden Gems',
      description: 'Masterpieces that flew under the mainstream radar.',
      params: { 'vote_average.gte': 7.5, 'vote_count.lte': 500 }
    },
    {
      slug: 'essential-legacy',
      title: 'Essential Legacy',
      description: 'The foundation of modern cinema. Golden Age classics.',
      params: { 'release_date.lte': '1980-01-01', 'vote_average.gte': 8 }
    },
    {
      slug: 'slow-burn',
      title: 'Slow Burn',
      description: 'Patient, deliberate cinema that rewards your full attention.',
      params: { with_genres: '18,9648', 'vote_average.gte': 7.5, sort_by: 'vote_average.desc' }
    },
    {
      slug: 'world-cinema',
      title: 'World Cinema',
      description: 'stories told in other tongues — equally universal, more alive.',
      params: { with_original_language: 'ko|ja|fr|it|es|de|zh', 'vote_average.gte': 7.5, sort_by: 'vote_average.desc' }
    },
    {
      slug: 'edge-of-tomorrow',
      title: 'Edge of Tomorrow',
      description: 'High-concept stories that bend time, reality, and consequence.',
      params: { with_genres: '878,53,9648', 'vote_average.gte': 7, sort_by: 'popularity.desc' }
    },
    {
      slug: 'human-condition',
      title: 'Human Condition',
      description: 'Unflinching portraits of grief, connection, and what it means to be alive.',
      params: { with_genres: '18', 'vote_average.gte': 7.8, sort_by: 'vote_average.desc' }
    },
  ];

  static async getCuratedCollections(): Promise<{ slug: string; title: string; description: string; movies: UniversalMedia[] }[]> {
    const results = await Promise.all(this.SELECTIONS.map(async (col) => {
      const data = await this.fetchWithRateLimit(this.getUrl('/discover/movie', col.params));
      const normalized = data.results.slice(0, 10).map((item: any) => UniversalTransformer.fromTMDB(item, 'movie'));
      return {
        slug: col.slug,
        title: col.title,
        description: col.description,
        movies: normalized
      };
    }));

    return results;
  }

  // Canonical style → TMDB genre ID mapping
  static readonly STYLE_MAP: Record<string, { label: string; description: string; genreIds: number[]; tvGenreIds?: number[] }> = {
    'essential': {
      label: 'Essential',
      description: 'Monumental achievements that redefined the art form.',
      genreIds: [16, 99, 10402],
      tvGenreIds: [16, 99]
    },
    'avant-garde': {
      label: 'Avant-Garde',
      description: 'Reality-bending films that shatter conventions and genre itself.',
      genreIds: [878, 14, 12, 9648],
      tvGenreIds: [878, 10765, 9648]
    },
    'melancholic': {
      label: 'Melancholic',
      description: 'Evocative stories exploring grief, love, and the human condition.',
      genreIds: [18, 10749],
      tvGenreIds: [18]
    },
    'atmospheric': {
      label: 'Atmospheric',
      description: 'Immersive worlds where the setting becomes the story.',
      genreIds: [35, 10402, 36],
      tvGenreIds: [35, 10402]
    },
    'noir': {
      label: 'Noir',
      description: 'Shadowy crime, moral ambiguity, and darkness without apology.',
      genreIds: [80, 27, 10752],
      tvGenreIds: [80, 27]
    },
    'visceral': {
      label: 'Visceral',
      description: 'High-octane cinema built to be felt in your chest.',
      genreIds: [28, 12],
      tvGenreIds: [10759]
    },
    'legacy': {
      label: 'Legacy',
      description: 'Timeless stories of history, heritage, and the frontier.',
      genreIds: [36, 10751, 37, 10770],
      tvGenreIds: [10751, 36, 37]
    },
    'provocative': {
      label: 'Provocative',
      description: 'Tense, gripping narratives designed to unsettle and challenge.',
      genreIds: [53, 9648, 80],
      tvGenreIds: [9648, 80]
    },
  };

  static async getByStyle(slug: string, page: number = 1): Promise<{ movies: { results: UniversalMedia[], totalPages: number }; tv: { results: UniversalMedia[], totalPages: number } }> {
    const styleData = this.STYLE_MAP[slug];
    if (!styleData) return { movies: { results: [], totalPages: 0 }, tv: { results: [], totalPages: 0 } };

    const genreStr = styleData.genreIds.join('|');
    const tvGenreStr = (styleData.tvGenreIds || styleData.genreIds).join('|');

    const [movieData, tvData] = await Promise.all([
      this.fetchWithRateLimit(this.getUrl('/discover/movie', {
        with_genres: genreStr,
        'vote_average.gte': 7,
        sort_by: 'popularity.desc',
        page: page,
      })),
      this.fetchWithRateLimit(this.getUrl('/discover/tv', {
        with_genres: tvGenreStr,
        'vote_average.gte': 7,
        sort_by: 'popularity.desc',
        page: page,
      })),
    ]);

    return {
      movies: {
        results: movieData.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'movie')),
        totalPages: movieData.total_pages
      },
      tv: {
        results: tvData.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'tv')),
        totalPages: tvData.total_pages
      }
    };
  }

  static async getByGenre(genreId: number, type: 'movie' | 'tv' = 'movie', page: number = 1): Promise<{ results: UniversalMedia[]; totalPages: number }> {
    const data = await this.fetchWithRateLimit(this.getUrl(`/discover/${type}`, {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page: page,
    }));
    return {
      results: data.results.map((item: any) => UniversalTransformer.fromTMDB(item, type)),
      totalPages: data.total_pages,
    };
  }

  static async getBySelection(slug: string, page: number = 1): Promise<{ title: string; description: string; movies: { results: UniversalMedia[], totalPages: number } } | null> {
    const selection = this.SELECTIONS.find(s => s.slug === slug);
    if (!selection) return null;

    const data = await this.fetchWithRateLimit(this.getUrl('/discover/movie', {
      ...selection.params,
      page: page,
    }));

    return {
      title: selection.title,
      description: selection.description,
      movies: {
        results: data.results.map((item: any) => UniversalTransformer.fromTMDB(item, 'movie')),
        totalPages: data.total_pages
      }
    };
  }

  static async getDeepDetails(id: number, type: 'movie' | 'tv'): Promise<UniversalMedia | null> {
    try {
      const url = this.getUrl(`/${type}/${id}`, {
        append_to_response: 'credits,videos,images,recommendations,watch/providers'
      });
      const data = await this.fetchWithRateLimit(url);
      return UniversalTransformer.fromTMDB(data, type);
    } catch (error) {
      console.error(`Failed to fetch deep details for ${type} ${id}:`, error);
      return null;
    }
  }
  static async searchMedia(query: string, page: number = 1): Promise<UniversalMedia[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    // Use movie search directly so "Attach Film" is movie-first and comprehensive.
    const [primary, secondary] = await Promise.all([
      this.fetchWithRateLimit(this.getUrl('/search/movie', {
        query: normalizedQuery,
        page,
        include_adult: false,
      })),
      this.fetchWithRateLimit(this.getUrl('/search/movie', {
        query: normalizedQuery,
        page: page + 1,
        include_adult: false,
      })),
    ]);

    const deduped = new Map<number, any>();
    for (const item of [...(primary.results || []), ...(secondary.results || [])]) {
      if (!item?.id || deduped.has(item.id)) continue;
      deduped.set(item.id, item);
    }

    return Array.from(deduped.values())
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
      .map((item: any) => UniversalTransformer.fromTMDB(item, 'movie'));
  }
}

