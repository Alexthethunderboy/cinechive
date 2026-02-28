import { UnifiedMedia } from './mapping';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

function getUrl(path: string, params: Record<string, any> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.append('api_key', process.env.TMDB_API_KEY || '');
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.append(key, String(val));
  });
  return url.toString();
}

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  media_type: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
}

export interface TMDBSearchResult {
  results: TMDBMedia[];
  total_results: number;
  total_pages: number;
}

export function posterUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
  if (!path) return null;
  return `${TMDB_IMG}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') {
  if (!path) return null;
  return `${TMDB_IMG}/${size}${path}`;
}

export async function searchMedia(query: string, page = 1): Promise<TMDBSearchResult> {
  const url = getUrl('/search/multi', { query, page, include_adult: false });
  const res = await fetch(url, { next: { revalidate: 3600 } });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`TMDB search failed [${res.status}]: ${errorText}`);
    throw new Error(`TMDB search failed: ${res.status}`);
  }
  return res.json();
}

export async function discoverMedia(params: Record<string, any> = {}): Promise<TMDBSearchResult> {
  const url = getUrl('/discover/movie', { 
    ...params, 
    include_adult: false,
    sort_by: 'popularity.desc'
  });
  const res = await fetch(url, { next: { revalidate: 3600 } });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`TMDB discover failed [${res.status}]: ${errorText}`);
    throw new Error(`TMDB discover failed: ${res.status}`);
  }
  return res.json();
}

export async function getTrending(
  timeWindow: 'day' | 'week' = 'week'
): Promise<TMDBSearchResult> {
  const url = getUrl(`/trending/all/${timeWindow}`);
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`TMDB trending failed [${res.status}]: ${errorText}`);
      throw new Error(`TMDB trending failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error("TMDB Trending Fetch Error:", err);
    throw err;
  }
}

export async function getMovieDetails(id: number) {
  const url = getUrl(`/movie/${id}`, { 
    append_to_response: 'credits,videos,images,recommendations,release_dates,keywords,external_ids' 
  });
  const res = await fetch(url, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`TMDB movie detail failed: ${res.status}`);
  return res.json();
}
export async function getPersonDetails(id: number) {
  const url = getUrl(`/person/${id}`, { 
    append_to_response: 'combined_credits,external_ids' 
  });
  const res = await fetch(url, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`TMDB person detail failed: ${res.status}`);
  return res.json();
}

export async function getTvDetails(id: number) {
  const url = getUrl(`/tv/${id}`, { 
    append_to_response: 'credits,videos,images,recommendations,keywords,external_ids' 
  });
  const res = await fetch(url, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`TMDB TV detail failed: ${res.status}`);
  return res.json();
}

export async function getPersonMovieCredits(id: number) {
  const url = getUrl(`/person/${id}/movie_credits`);
  const res = await fetch(url, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`TMDB person movie credits failed: ${res.status}`);
  return res.json();
}

export async function enrichWithDirector(mediaArray: UnifiedMedia[]): Promise<UnifiedMedia[]> {
  const promises = mediaArray.map(async (media) => {
    try {
      if (media.type === 'movie') {
        const details = await getMovieDetails(parseInt(media.id));
        const director = details.credits?.crew?.find((c: any) => c.job === 'Director');
        if (director) return { ...media, director: director.name };
      } else if (media.type === 'tv' || media.type === 'documentary') {
        const details = await getTvDetails(parseInt(media.id));
        const creator = details.created_by?.[0]?.name;
        if (creator) return { ...media, director: creator };
      }
    } catch(e) { /* fallback to original if tmdb limits or fails */ }
    return media;
  });

  return Promise.all(promises);
}
