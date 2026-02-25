
import { searchMedia, getMovieDetails, getTvDetails, getPersonDetails, TMDBMedia } from '../api/tmdb';
import { mapTMDBToUnified, UnifiedMedia } from '../api/mapping';

export class SearchService {
  /**
   * Global search across Movies, TV, People, and Music
   */
  static async globalSearch(query: string, options?: {
    mood?: string;
    hiddenGems?: boolean;
  }): Promise<{
    movies: UnifiedMedia[];
    tv: UnifiedMedia[];
    people: any[];
  }> {
    if (!query) return { movies: [], tv: [], people: [] };

    const tmdbResults = await searchMedia(query).catch(() => ({ results: [] }));

    let results = tmdbResults.results || [];

    // Apply Mood Filtering if requested
    if (options?.mood) {
      results = results.filter((m: any) => {
        const unified = mapTMDBToUnified(m);
        return unified.classification.toLowerCase() === options.mood?.toLowerCase();
      });
    }

    // Apply Hidden Gems Filtering
    // Logic: Low Popularity (< 50) + High Rating (> 7.0)
    if (options?.hiddenGems) {
      results = results.filter((m: any) => {
        const popularity = m.popularity || 0;
        const rating = m.vote_average || 0;
        return popularity < 50 && rating > 7.0;
      });
    }

    const movies = results
      .filter((m: TMDBMedia) => m.media_type === 'movie')
      .map(mapTMDBToUnified);
    
    const tv = results
      .filter((m: TMDBMedia) => m.media_type === 'tv')
      .map(mapTMDBToUnified);

    const people = results
      .filter((m: TMDBMedia) => m.media_type === 'person')
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        type: 'person',
        profileUrl: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
        knownFor: p.known_for_department,
      }));

    return { movies, tv, people };
  }

  /**
   * Fetches full entity graph for a movie/tv show including its soundtrack
   */
  static async getDeepEntityDetails(id: string, type: 'movie' | 'tv') {
    const numericId = parseInt(id);
    const mediaDetails = type === 'movie' 
      ? await getMovieDetails(numericId)
      : await getTvDetails(numericId);

    // Year resolution
    const year = new Date(mediaDetails.release_date || mediaDetails.first_air_date).getFullYear();

    // Filter for composers in credits
    const composers = mediaDetails.credits?.crew?.filter(
      (member: any) => member.job === 'Original Music Composer' || member.job === 'Music'
    ) || [];

    return {
      ...mediaDetails,
      composers: composers.map((c: any) => ({
        id: c.id,
        name: c.name,
        profilePath: c.profile_path,
      }))
    };
  }

  /**
   * Fetches a person's catalog (Director/Actor/Composer) and interlinks with music if applicable
   */
  static async getCatalogForPerson(personId: string) {
    const numericId = parseInt(personId);
    const person = await getPersonDetails(numericId);
    
    // If they are a composer, we might want to fetch their Spotify profile too
    // For now, we rely on the person details which includes their movie/tv credits
    
    return person;
  }
}
