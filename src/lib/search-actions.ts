'use server';

import { searchMedia, enrichWithDirector } from './api/tmdb';
import { mapTMDBToUnified, UnifiedMedia } from './api/mapping';
import { SearchService } from './services/SearchService';
import { MediaFetcher } from './api/MediaFetcher';

export async function unifiedSearchAction(query: string, type: 'all' | 'video' = 'all'): Promise<UnifiedMedia[]> {
  if (!query) return [];

  const promises: Promise<any>[] = [];

  if (type === 'all' || type === 'video') {
    promises.push(searchMedia(query).catch(() => ({ results: [] })));
  }

  const results = await Promise.all(promises);
  let globalResults: UnifiedMedia[] = results[0].results.map(mapTMDBToUnified);

  globalResults = globalResults.slice(0, 20);
  globalResults = await enrichWithDirector(globalResults);

  return globalResults;
}

export async function getSeasonEpisodesAction(tvId: number, seasonNumber: number) {
  return SearchService.getSeason(tvId, seasonNumber);
}

export async function globalSearchAction(query: string, options?: { mood?: string; hiddenGems?: boolean }) {
  return SearchService.globalSearch(query, options);
}

export async function getDeepEntityAction(id: string, type: 'movie' | 'tv') {
  return SearchService.getDeepEntityDetails(id, type);
}

export async function getPersonCatalogAction(personId: string) {
  return SearchService.getCatalogForPerson(personId);
}

export async function getCuratedCollectionsAction() {
  return MediaFetcher.getCuratedCollections();
}

export async function getStylePageAction(slug: string, page: number = 1) {
  return MediaFetcher.getByStyle(slug, page);
}

export async function getGenrePageAction(genreId: number, type: 'movie' | 'tv' = 'movie', page: number = 1) {
  return MediaFetcher.getByGenre(genreId, type, page);
}

export async function getSelectionPageAction(slug: string, page: number = 1) {
  return MediaFetcher.getBySelection(slug, page);
}

