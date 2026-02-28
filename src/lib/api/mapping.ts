import { TMDBMedia, posterUrl, backdropUrl } from './tmdb';
import { ClassificationName } from '../design-tokens';
import { deriveClassification } from '../classification-utils';

export interface UnifiedMedia {
  id: string;
  title: string;
  displayName: string; // Alias for title
  type: 'movie' | 'tv' | 'documentary' | 'anime';
  posterUrl: string | null;
  year?: number;
  releaseYear?: number; // Alias for year
  classification: ClassificationName;
  director?: string;
  rating?: {
    average: number;
    count: number;
    showBadge: boolean;
  };
  genres: string[];
}

export interface DetailedMedia extends UnifiedMedia {
  description: string;
  backdropUrl: string | null;
  genres: string[];
  duration?: string;
  cast?: { id: string; name: string; role: string; profilePath: string | null }[];
  crew?: { id: string; name: string; role: string; profilePath: string | null }[];
  trailerUrl?: string;
  stats?: { label: string; value: string }[];
  budget?: number;
  revenue?: number;
  soundtrack?: { title: string; artist: string; scene?: string; spotifyUrl?: string }[];
  composers?: { id: string; name: string; profilePath: string | null }[];
}

/**
 * Standard Mappings (Search/Trending)
 */

export function mapTMDBToUnified(item: TMDBMedia): UnifiedMedia {
  const isTv = item.media_type === 'tv' || (!item.title && !!item.name);
  const type = isTv ? 'tv' : 'movie';
  const year = item.release_date || item.first_air_date 
    ? new Date(item.release_date || item.first_air_date!).getFullYear() 
    : undefined;

  const title = item.title || item.name || 'Untitled';
  return {
    id: String(item.id),
    title,
    displayName: title,
    type,
    posterUrl: posterUrl(item.poster_path),
    year,
    releaseYear: year,
    classification: deriveClassification(type, item) as ClassificationName,
    rating: {
      average: item.vote_average || 0,
      count: item.vote_count || 0,
      showBadge: (item.vote_count || 0) > 100,
    },
    genres: [],
  };
}

/**
 * Detailed Mappings
 */

export function mapTMDBDetailToUnified(data: any, type: 'movie' | 'tv'): DetailedMedia {
  const isMovie = type === 'movie';
  const trailer = data.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  
  const title = data.title || data.name;
  const year = new Date(data.release_date || data.first_air_date).getFullYear();

  return {
    id: String(data.id),
    title,
    displayName: title,
    type: data.genres?.some((g: any) => g.id === 99) ? 'documentary' : type,
    posterUrl: posterUrl(data.poster_path),
    backdropUrl: backdropUrl(data.backdrop_path),
    year,
    releaseYear: year,
    description: data.overview,
    classification: deriveClassification(type, data),
    genres: data.genres?.map((g: any) => g.name) || [],
    duration: isMovie ? `${data.runtime} min` : `${data.number_of_seasons} Seasons`,
    cast: data.credits?.cast?.slice(0, 12).map((c: any) => ({ 
      id: String(c.id), 
      name: c.name, 
      role: c.character,
      profilePath: c.profile_path ? posterUrl(c.profile_path, 'w342') : null
    })),
    crew: data.credits?.crew?.filter((c: any) => 
      ['Director', 'Executive Producer', 'Director of Photography', 'Original Music Composer', 'Screenplay', 'Writer'].includes(c.job)
    ).slice(0, 8).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      role: c.job,
      profilePath: c.profile_path ? posterUrl(c.profile_path, 'w342') : null
    })),
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
    stats: [
      { label: 'Rating', value: data.vote_average?.toFixed(1) },
      { label: 'Popularity', value: Math.round(data.popularity).toLocaleString() },
      { label: 'Status', value: data.status },
    ],
    budget: data.budget,
    revenue: data.revenue,
  };
}

export function mapTMDBPersonCreditToUnified(credit: any): UnifiedMedia {
  const type = credit.media_type === 'tv' ? 'tv' : 'movie';
  const year = credit.release_date || credit.first_air_date 
    ? new Date(credit.release_date || credit.first_air_date!).getFullYear() 
    : undefined;

  const title = credit.title || credit.name || 'Untitled';
  return {
    id: String(credit.id),
    title,
    displayName: title,
    type,
    posterUrl: credit.poster_path ? posterUrl(credit.poster_path) : null,
    year,
    releaseYear: year,
    classification: deriveClassification(type, credit),
    rating: {
      average: credit.vote_average || 0,
      count: credit.vote_count || 0,
      showBadge: (credit.vote_count || 0) > 100,
    },
    genres: [],
  };
}

export function mapAniListDetailToUnified(data: any): DetailedMedia {
  const trailer = data.trailer?.site === 'youtube' && data.trailer.id 
    ? `https://www.youtube.com/watch?v=${data.trailer.id}` 
    : undefined;
    
  const title = data.title?.english || data.title?.romaji || 'Unknown Anime';
  const year = data.startDate?.year || undefined;

  return {
    id: String(data.id),
    title,
    displayName: title,
    type: 'anime',
    posterUrl: data.coverImage?.extraLarge || data.coverImage?.large || null,
    backdropUrl: data.bannerImage || null,
    year,
    releaseYear: year,
    description: data.description?.replace(/<[^>]*>?/gm, '') || '',
    classification: 'Atmospheric',
    genres: data.genres || [],
    duration: data.episodes ? `${data.episodes} Episodes` : undefined,
    cast: data.characters?.edges?.slice(0, 12).map((edge: any) => ({
      id: String(edge.node.id),
      name: edge.node.name?.userPreferred,
      role: edge.role || 'Character',
      profilePath: edge.node.image?.large || null
    })) || [],
    crew: [], // AniList crew mapping can be added if needed
    trailerUrl: trailer,
    stats: [
      { label: 'Score', value: data.averageScore ? `${data.averageScore}%` : 'N/A' },
      { label: 'Format', value: data.format || 'TV' },
      { label: 'Status', value: data.status },
    ],
    rating: {
      average: (data.averageScore || 0) / 10,
      count: data.popularity || 0,
      showBadge: (data.popularity || 0) > 1000,
    }
  };
}
