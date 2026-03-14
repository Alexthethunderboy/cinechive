import { UniversalMedia, UniversalTransformer } from './UniversalTransformer';

export type { UniversalMedia };

/**
 * Standard Mappings (Legacy support aliases)
 */
export type UnifiedMedia = UniversalMedia;
export type DetailedMedia = UniversalMedia;

export function mapTMDBToUnified(item: any): UniversalMedia {
  return UniversalTransformer.fromTMDB(item);
}

export function mapTMDBDetailToUnified(data: any, type: 'movie' | 'tv'): UniversalMedia {
  return UniversalTransformer.fromTMDB(data, type);
}

export function mapTMDBPersonCreditToUnified(credit: any): UniversalMedia {
  return UniversalTransformer.fromTMDB(credit);
}

export function mapAniListDetailToUnified(data: any): UniversalMedia {
  return UniversalTransformer.fromAniList(data);
}

