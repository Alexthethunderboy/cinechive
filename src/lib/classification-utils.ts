import { ClassificationName } from './design-tokens';

/**
 * CineChive Classification Engine
 * Maps real-world cinema genres and keywords to the professional CineChive taxonomy.
 */

const CINEMA_GENRE_MAP: Record<number, ClassificationName> = {
  28: 'Visceral',          // Action
  12: 'Avant-Garde',       // Adventure
  16: 'Essential',         // Animation
  35: 'Atmospheric',       // Comedy
  80: 'Noir',              // Crime
  99: 'Essential',         // Documentary
  18: 'Melancholic',       // Drama
  10751: 'Legacy',         // Family
  14: 'Avant-Garde',       // Fantasy
  36: 'Legacy',            // History
  27: 'Noir',              // Horror
  10402: 'Atmospheric',    // Music (film)
  9648: 'Avant-Garde',      // Mystery
  10749: 'Melancholic',    // Romance
  878: 'Avant-Garde',      // Sci-Fi
  10770: 'Legacy',         // TV Movie
  53: 'Provocative',       // Thriller
  10752: 'Noir',           // War
  37: 'Legacy',            // Western
};

export function getClassificationFromGenres(genreIds: number[]): ClassificationName {
  if (!genreIds.length) return 'Atmospheric';
  for (const id of genreIds) {
    if (CINEMA_GENRE_MAP[id]) return CINEMA_GENRE_MAP[id];
  }
  return 'Atmospheric';
}

/**
 * Predictable classification for cinema items.
 */
export function deriveClassification(type: 'movie' | 'tv' | 'documentary', data: any): ClassificationName {
  return getClassificationFromGenres(data.genre_ids || []);
}
