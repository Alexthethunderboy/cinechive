import { TMDBMedia, posterUrl, backdropUrl } from './tmdb';

export interface FeedEntity {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  displayName: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  releaseLabel: string | null;
  overview: string;
  rating: {
    average: number;
    count: number;
    showBadge: boolean;
  };
  genres: string[];
  director: string | null;
  dp: string | null; // Director of Photography
  ep: string | null; // Executive Producer for TV
  cast: { id: string; name: string; role: string; profileUrl: string | null }[];
  trailerUrl: string | null;
  recommendations: { id: string; title: string; posterUrl: string | null; type: 'movie' | 'tv' }[];
  providers: { provider_id: number; provider_name: string; logo_path: string | null }[];
  business?: { budget: number; revenue: number };
}

// Simple rate limiter implementation
class RateLimiter {
  private queue: (() => void)[] = [];
  private tokens: number;
  private maxTokens: number;
  private refillRateMs: number;
  private checkInterval: NodeJS.Timeout | null = null;

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
const tmdbRateLimiter = new RateLimiter(38, 10000); // Leave a small buffer

export class MediaFetcher {
  private static TMDB_BASE = 'https://api.themoviedb.org/3';
  
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
      console.error(`TMDB fetch failed [${res.status}]: ${errorText}`);
      throw new Error(`TMDB fetch failed: ${res.status}`);
    }
    return res.json();
  }

  static async getTrendingFeed(type: 'movie' | 'tv', page: number = 1): Promise<{ results: FeedEntity[], totalPages: number }> {
    const url = this.getUrl(`/trending/${type}/day`, { page });
    const trendingData = await this.fetchWithRateLimit(url);
    
    // Fetch deep details for each item concurrently
    const deepFetchPromises = trendingData.results.map((item: any) => this.getDeepDetails(item.id, type));
    const detailedResults = await Promise.all(deepFetchPromises);

    // Filter out any failed deep fetches
    const validResults = detailedResults.filter(Boolean) as FeedEntity[];

    return {
      results: validResults,
      totalPages: trendingData.total_pages,
    };
  }

  static async getDeepDetails(id: number, type: 'movie' | 'tv'): Promise<FeedEntity | null> {
    try {
      const url = this.getUrl(`/${type}/${id}`, {
        append_to_response: 'credits,videos,images,recommendations,watch/providers'
      });
      const data = await this.fetchWithRateLimit(url);
      return this.normalizeData(data, type);
    } catch (error) {
      console.error(`Failed to fetch deep details for ${type} ${id}:`, error);
      return null;
    }
  }

  private static normalizeData(data: any, type: 'movie' | 'tv'): FeedEntity {
    // Determine release date and label
    let releaseDateStr = type === 'movie' ? data.release_date : data.first_air_date;
    let releaseYear = releaseDateStr ? new Date(releaseDateStr).getFullYear() : null;
    let releaseLabel = data.status || null;

    if (type === 'movie' && data.status) {
      if (data.status === 'Released') releaseLabel = 'Now Playing';
      if (data.status === 'Post Production' || data.status === 'Planned') releaseLabel = 'Coming Soon';
    } else if (type === 'tv' && data.status) {
        if (data.status === 'Ended') releaseLabel = 'Completed';
        if (data.status === 'Returning Series') releaseLabel = 'Returning';
    }

    // Credits
    const cast = (data.credits?.cast || []).slice(0, 5).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      role: c.character,
      profileUrl: posterUrl(c.profile_path, 'w500'), // Or a specialized profile url
    }));

    const crew = data.credits?.crew || [];
    let director = null;
    let dp = null;
    let ep = null;

    if (type === 'movie') {
      director = crew.find((c: any) => c.job === 'Director')?.name || null;
      dp = crew.find((c: any) => c.job === 'Director of Photography')?.name || null;
    } else {
      ep = crew.find((c: any) => c.job === 'Executive Producer')?.name || null;
      director = data.created_by?.[0]?.name || null; // Creator for TV
    }

    // Trailer
    const videos = data.videos?.results || [];
    const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube' && v.official) 
      || videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

    // Recommendations
    const recommendations = (data.recommendations?.results || []).slice(0, 5).map((r: any) => ({
      id: String(r.id),
      title: r.title || r.name,
      posterUrl: posterUrl(r.poster_path, 'w500'),
      type: r.media_type || type,
    }));

    // Providers (US region default for now, can be parameterized)
    const providersData = data['watch/providers']?.results?.US;
    const allProviders = [...(providersData?.flatrate || []), ...(providersData?.buy || []), ...(providersData?.rent || [])];
    
    // Deduplicate providers by ID
    const uniqueProviders = Array.from(new Map(allProviders.map(item => [item.provider_id, item])).values()).map((p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: posterUrl(p.logo_path, 'original') // Use original or w500 depending on needs
    }));

    // Vote metrics
    const voteCount = data.vote_count || 0;
    const voteAverage = data.vote_average || 0;

    return {
      id: String(data.id),
      type,
      displayName: data.title || data.name || 'Untitled',
      posterUrl: posterUrl(data.poster_path, 'w500'),
      backdropUrl: backdropUrl(data.backdrop_path, 'original'),
      releaseYear,
      releaseLabel,
      overview: data.overview || '',
      rating: {
        average: voteAverage,
        count: voteCount,
        showBadge: voteCount > 100,
      },
      genres: (data.genres || []).map((g: any) => g.name),
      director,
      dp,
      ep,
      cast,
      trailerUrl,
      recommendations,
      providers: uniqueProviders,
      business: type === 'movie' && (data.budget > 0 || data.revenue > 0) ? {
        budget: data.budget || 0,
        revenue: data.revenue || 0,
      } : undefined,
    };
  }
}
