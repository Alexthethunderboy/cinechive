import { TMDBMedia, posterUrl, backdropUrl } from './tmdb';
import { AniListAnime } from './anilist';
import { ClassificationName } from '../design-tokens';
import { deriveClassification } from '../classification-utils';
import { formatCountdown } from '../date-utils';

/**
 * Universal Media Interface
 * The single source of truth for all media items in CineChive.
 */
export interface UniversalMedia {
  id: string;
  sourceId: string | number;
  source: 'tmdb' | 'anilist';
  type: 'movie' | 'tv' | 'anime' | 'animation' | 'person';
  
  // Basic Metadata
  displayTitle: string;
  englishTitle?: string | null;
  romajiTitle?: string | null;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  imdbId?: string | null;
  
  // Taxonomy & Temporal
  classification: ClassificationName;
  genres: string[];
  releaseYear: number | null;
  releaseDate: string | null; // YYYY-MM-DD
  status: string | null;
  
  // Metrics
  rating: {
    average: number;
    count: number;
    showBadge: boolean;
  };
  popularity: number;
  
  // Credits (Optional/Lazy)
  director?: string | null;
  creator?: string | null;
  dp?: string | null;
  ep?: string | null;
  composers?: { id: string; name: string; profileUrl: string | null }[];
  studio?: string | null;
  cast?: { id: string; name: string; role: string; profileUrl: string | null }[];
  
  // Anime/Animation Specifics
  format?: string | null; // e.g. TV, MOVIE, OVA
  episodes?: number | null;
  season?: string | null;
  
  // Media Links & Extras
  trailerUrl?: string | null;
  duration?: string | null;
  recommendations?: { id: string; title: string; posterUrl: string | null; type: 'movie' | 'tv' | 'anime' }[];
  providers?: { provider_id: number; provider_name: string; logo_path: string | null }[];
  business?: { budget: number; revenue: number };
  crew?: { id: string; name: string; role: string; profileUrl: string | null }[];
  soundtrack?: { title: string; artist: string; previewUrl: string | null }[];
  stats?: { label: string; value: string | number }[];
  
  // High-Density Content
  seasons?: { 
    id: number;
    seasonNumber: number; 
    episodeCount: number; 
    name: string;
    overview: string;
    posterUrl: string | null; 
    airDate: string | null; 
  }[];
  collection?: {
    id: number;
    name: string;
    posterUrl: string | null;
    backdropUrl: string | null;
    parts: { id: string; title: string; posterUrl: string | null; releaseDate: string | null; type: 'movie' }[];
  };
  streamingEpisodes?: { title: string; thumbnail: string | null; url: string; site: string }[];
  
  // Radar / Future Logic
  targetDate?: string;
  countdown?: string;
  hypeLevel?: number;
}

export class UniversalTransformer {
  /**
   * Transforms TMDB raw data into UniversalMedia.
   */
  static fromTMDB(item: any, forceType?: 'movie' | 'tv' | 'animation'): UniversalMedia {
    const isTv = forceType === 'tv' || item.media_type === 'tv' || (!item.title && !!item.name);
    const type = forceType || (isTv ? 'tv' : 'movie');
    
    const title = item.title || item.name || 'Untitled';
    const releaseDate = item.release_date || item.first_air_date || null;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

    // Credits extraction
    const crewRaw = item.credits?.crew || [];
    const director = type === 'movie' ? crewRaw.find((c: any) => c.job === 'Director')?.name || null : item.created_by?.[0]?.name || null;
    const dp = crewRaw.find((c: any) => c.job === 'Director of Photography')?.name || null;
    const ep = crewRaw.find((c: any) => c.job === 'Executive Producer')?.name || null;
    
    // Detailed Crew
    const crew = crewRaw
      .filter((c: any) => ['Director', 'Director of Photography', 'Executive Producer', 'Writer', 'Producer', 'Screenplay'].includes(c.job))
      .slice(0, 12)
      .map((c: any) => ({
        id: String(c.id),
        name: c.name,
        role: c.job,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : null,
      }));
    
    const cast = (item.credits?.cast || []).slice(0, 12).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      role: c.character,
      profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w500${c.profile_path}` : null,
    }));

    const composers = (item.credits?.crew || [])
      .filter((c: any) => c.job === 'Original Music Composer' || c.job === 'Music')
      .map((c: any) => ({
        id: String(c.id),
        name: c.name,
        profileUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      }));

    // Trailer
    const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key;

    // Providers
    const providersData = item['watch/providers']?.results?.US;
    const allProviders = [...(providersData?.flatrate || []), ...(providersData?.buy || []), ...(providersData?.rent || [])];
    const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values()).map((p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null
    }));

    return {
      id: `tmdb-${item.id}`,
      sourceId: item.id,
      source: 'tmdb',
      type: type as any,
      displayTitle: title,
      englishTitle: title,
      overview: item.overview || '',
      posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
      imdbId: item.external_ids?.imdb_id || null,
      classification: deriveClassification(type === 'tv' ? 'tv' : 'movie', item),
      genres: item.genres?.map((g: any) => g.name) || [],
      releaseYear: year,
      releaseDate,
      status: item.status || null,
      seasons: (item.seasons || []).map((s: any) => ({
        id: s.id,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count,
        name: s.name,
        overview: s.overview,
        posterUrl: s.poster_path ? `https://image.tmdb.org/t/p/w342${s.poster_path}` : null,
        airDate: s.air_date || null,
      })),
      collection: item.belongs_to_collection ? {
        id: item.belongs_to_collection.id,
        name: item.belongs_to_collection.name,
        posterUrl: item.belongs_to_collection.poster_path ? `https://image.tmdb.org/t/p/w500${item.belongs_to_collection.poster_path}` : null,
        backdropUrl: item.belongs_to_collection.backdrop_path ? `https://image.tmdb.org/t/p/original${item.belongs_to_collection.backdrop_path}` : null,
        parts: [] // Will be populated by a separate fetch if needed, or by deep context
      } : undefined,
      recommendations: (item.recommendations?.results || []).slice(0, 8).map((r: any) => ({
        id: String(r.id),
        title: r.title || r.name,
        posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null,
        type: r.media_type || (r.title ? 'movie' : 'tv')
      })),
      rating: {
        average: item.vote_average || 0,
        count: item.vote_count || 0,
        showBadge: (item.vote_count || 0) > 100,
      },
      popularity: item.popularity || 0,
      director,
      dp,
      ep,
      composers,
      cast,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer}` : null,
      providers: uniqueProviders.length > 0 ? uniqueProviders : undefined,
      business: item.budget || item.revenue ? { budget: item.budget || 0, revenue: item.revenue || 0 } : undefined,
      crew,
      duration: item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : (item.episode_run_time?.[0] ? `${item.episode_run_time[0]}m` : null),
      stats: [
        { label: 'Popularity', value: Math.round(item.popularity || 0) },
        { label: 'Votes', value: item.vote_count || 0 },
        { label: 'Global Rank', value: `#${Math.floor(Math.random() * 1000) + 1}` } // Simulation for now
      ],
      
      // Radar Logic
      targetDate: releaseDate || undefined,
      countdown: formatCountdown(releaseDate),
      hypeLevel: Math.min(Math.round((item.popularity || 0) / 10), 100),
    };
  }

  /**
   * Transforms AniList raw data into UniversalMedia.
   */
  static fromAniList(item: any): UniversalMedia {
    const title = item.title?.userPreferred || item.title?.english || item.title?.romaji || 'Unknown Anime';
    
    let releaseDate = null;
    if (item.startDate?.year) {
      releaseDate = `${item.startDate.year}-${String(item.startDate.month || 1).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}`;
    }
    const year = item.startDate?.year || null;

    // Map AniList status to something more cinematic
    let status = item.status;
    if (status === 'RELEASING') status = 'Currently Airing';
    if (status === 'FINISHED') status = 'Released';

    // Cast mapping
    const cast = (item.characters?.edges || []).slice(0, 12).map((edge: any) => ({
      id: String(edge.node.id),
      name: edge.voiceActors?.[0]?.name.userPreferred || edge.node.name.userPreferred,
      role: edge.node.name.userPreferred,
      profileUrl: edge.node.image?.large || null,
    }));

    return {
      id: `anilist-${item.id}`,
      sourceId: item.id,
      source: 'anilist',
      type: 'anime',
      displayTitle: title,
      englishTitle: item.title?.english || null,
      romajiTitle: item.title?.romaji || null,
      overview: item.description?.replace(/<[^>]*>?/gm, '') || '',
      posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || null,
      backdropUrl: item.bannerImage || null,
      classification: 'Atmospheric', 
      genres: item.genres || [],
      releaseYear: year,
      releaseDate,
      status,
      rating: {
        average: item.averageScore ? (item.averageScore / 10) : 0,
        count: item.popularity || 0,
        showBadge: (item.popularity || 0) > 1000,
      },
      popularity: item.trending || item.popularity || 0,
      studio: item.studios?.nodes?.find((s: any) => s.isAnimationStudio)?.name || null,
      cast,
      format: item.format || null,
      episodes: item.episodes || null,
      season: item.season ? `${item.season} ${item.seasonYear}` : null,
      trailerUrl: item.trailer?.site === 'youtube' ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
      streamingEpisodes: (item.streamingEpisodes || []).map((se: any) => ({
        title: se.title,
        thumbnail: se.thumbnail,
        url: se.url,
        site: se.site
      })),
      duration: item.episodes ? `${item.episodes} Episodes` : null,
      stats: [
        { label: 'Popularity', value: item.popularity || 0 },
        { label: 'Scoring', value: item.averageScore ? `${item.averageScore}%` : 'N/A' },
        { label: 'Trending', value: item.trending || 0 }
      ],
      crew: (item.studios?.nodes || []).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        role: s.isAnimationStudio ? 'Studio' : 'Staff',
        profileUrl: null
      })),
      
      // Radar Logic
      targetDate: releaseDate || undefined,
      countdown: formatCountdown(releaseDate),
      hypeLevel: Math.min(Math.round((item.trending || item.popularity || 0) / 20), 100),
    };
  }
}
