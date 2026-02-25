import { FeedEntity } from './MediaFetcher';
import { AniListAnime } from './anilist';

export interface AnimatrixEntity extends FeedEntity {
  isAnime: boolean;
  score: number | null; // AniList 0-100 score
  format: string | null; // e.g. TV, MOVIE, OVA
  season: string | null;
  studio: { name: string; isAnimationStudio: boolean } | null;
  totalEpisodes: number | null;
  englishTitle: string | null;
  romajiTitle: string | null;
}

export class MediaTransformer {
  static transformAniListToAnimatrix(anime: AniListAnime): AnimatrixEntity {
    // 1. Title Resolution (Prefer English, fallback to Romaji)
    const displayName = anime.title.english || anime.title.romaji || 'Unknown Anime';
    
    // 2. Determine main studio
    const mainStudio = anime.studios.nodes.find(s => s.isAnimationStudio) || anime.studios.nodes[0] || null;

    // 3. Format Label (ReleaseLabel equivalent)
    let releaseLabel = anime.status;
    if (anime.status === 'RELEASING') releaseLabel = 'Simulcast';
    if (anime.status === 'FINISHED') releaseLabel = 'Completed';
    if (anime.status === 'NOT_YET_RELEASED') releaseLabel = 'Upcoming';

    // 4. Transform Characters/Voice Actors to standard cast structure
    const cast = anime.characters.edges.slice(0, 5).map(edge => ({
      id: String(edge.node.id),
      name: edge.voiceActors?.[0]?.name.userPreferred || edge.node.name.userPreferred,
      role: edge.node.name.userPreferred,
      profileUrl: edge.node.image.large || null, // Character image acts as profile url
    }));

    // 5. Trailer URL
    const trailerUrl = anime.trailer?.site === 'youtube' && anime.trailer.id 
      ? `https://www.youtube.com/watch?v=${anime.trailer.id}`
      : null;

    // 6. Rating Normalization (AniList is 0-100, TMDB is 0-10. We map it to TMDB scale)
    const averageRating = anime.averageScore ? (anime.averageScore / 10) : 0;

    return {
      id: String(anime.id),
      type: 'anime', // Anime is now explicitly handled
      isAnime: true,
      displayName,
      englishTitle: anime.title.english || null,
      romajiTitle: anime.title.romaji || null,
      posterUrl: anime.coverImage.extraLarge || anime.coverImage.large || null,
      backdropUrl: anime.bannerImage || null,
      releaseYear: anime.startDate.year || null,
      releaseLabel,
      overview: anime.description?.replace(/<[^>]*>?/gm, '') || '', // Strip HTML from AniList Description
      rating: {
        average: averageRating,
        count: 0, // AniList doesn't reliably return vote count in simple queries without extra cost
        showBadge: averageRating > 0,
      },
      genres: anime.genres || [],
      director: null, // Often hidden in staff queries on Anilist, keeping null to prefer Studio
      dp: null,
      ep: null,
      cast,
      trailerUrl,
      recommendations: [], // Can implement related edges later if needed
      providers: [], // AniList doesn't provide streaming links for free, could integrate Crunchyroll linking 
      
      // Animatrix Specifics
      score: anime.averageScore || null,
      format: anime.format || null,
      season: anime.season ? `${anime.season} ${anime.seasonYear}` : null,
      studio: mainStudio ? { name: mainStudio.name, isAnimationStudio: mainStudio.isAnimationStudio } : null,
      totalEpisodes: anime.episodes || null,
    };
  }

  static transformFeedEntityToAnimatrix(feedEntity: FeedEntity): AnimatrixEntity {
    // This handles the TMDB Animation Feed results adapting them to the broader interface
    return {
      ...feedEntity,
      isAnime: false,
      score: feedEntity.rating.average ? (feedEntity.rating.average * 10) : null,
      format: feedEntity.type === 'movie' ? 'Feature Film' : 'Series',
      season: null,
      studio: null, // TMDB doesn't surface Production Companies on the simple Trending Feed easily without deep fetches
      totalEpisodes: null,
      englishTitle: feedEntity.displayName,
      romajiTitle: null,
    };
  }
}
