'use server';

import type { DetailedMedia } from '@/lib/api/mapping';
import { DeepDataService, type TriviaItem } from '@/lib/services/DeepDataService';
import { ScriptService, type ScriptInfo } from '@/lib/services/ScriptService';
import { SearchService } from '@/lib/services/SearchService';
import { WatchLinkService } from '@/lib/services/WatchLinkService';

interface CollectionPart {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
}

export interface MediaEnrichmentResult {
  media: DetailedMedia;
  trivia: TriviaItem[];
  scripts: ScriptInfo[];
}

/**
 * Best-effort detail enrichment. This intentionally runs after the core page
 * has rendered so optional provider links, trivia and franchise data cannot
 * delay navigation.
 */
export async function getMediaEnrichmentAction(
  initialMedia: DetailedMedia,
): Promise<MediaEnrichmentResult> {
  const collectionPromise = initialMedia.collection
    ? SearchService.getCollection(initialMedia.collection.id)
    : Promise.resolve(null);

  const [watchLinksResult, triviaResult, scriptsResult, collectionResult] = await Promise.allSettled([
    WatchLinkService.enrichWithExternalLinks(initialMedia),
    initialMedia.imdbId
      ? DeepDataService.fetchTrivia(String(initialMedia.sourceId), initialMedia.imdbId)
      : Promise.resolve([]),
    ScriptService.findScript(initialMedia.displayTitle, initialMedia.imdbId || undefined),
    collectionPromise,
  ]);

  let media = watchLinksResult.status === 'fulfilled' ? watchLinksResult.value : initialMedia;

  if (collectionResult.status === 'fulfilled' && collectionResult.value && media.collection) {
    media = {
      ...media,
      collection: {
        ...media.collection,
        parts: collectionResult.value.parts.map((part: CollectionPart) => ({
          id: String(part.id),
          title: part.title,
          posterUrl: part.poster_path ? `https://image.tmdb.org/t/p/w342${part.poster_path}` : null,
          releaseDate: part.release_date || null,
          type: 'movie' as const,
        })),
      },
    };
  }

  return {
    media,
    trivia: triviaResult.status === 'fulfilled' ? triviaResult.value : [],
    scripts: scriptsResult.status === 'fulfilled' ? scriptsResult.value : [],
  };
}
