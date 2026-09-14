import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  readSharedMedia,
  reconcileSharedMedia,
  type SharedMedia,
  type SharedMediaInput,
  type SharedMediaLinkScope,
  type SharedMediaType,
  type SharedMediaUpsert,
} from '@/lib/shared-media-store';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const MAX_BATCH_SIZE = 250;
const TMDB_CONCURRENCY = 5;

interface IngestBody {
  query?: unknown;
  media_type?: unknown;
  icloud_link?: unknown;
  link_scope?: unknown;
  season_number?: unknown;
  source_key?: unknown;
  source_name?: unknown;
  replaces_source_keys?: unknown;
  year?: unknown;
}

interface ParsedIngestItem {
  query: string;
  mediaType: SharedMediaType;
  icloudLink: string;
  linkScope: SharedMediaLinkScope;
  seasonNumber: number | null;
  sourceKey: string | null;
  sourceName: string | null;
  replacesSourceKeys: string[];
  year: number | null;
}

interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

interface TmdbVideo {
  key: string;
  official: boolean;
  site: string;
  type: string;
}

interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  genres?: Array<{ id: number; name: string }>;
  videos?: { results?: TmdbVideo[] };
}

class IngestItemError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function hasValidSecret(request: Request, expectedSecret: string) {
  const authorization = request.headers.get('authorization');
  const suppliedSecret = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : request.headers.get('x-ingest-secret')?.trim();

  if (!suppliedSecret) return false;
  const expected = Buffer.from(expectedSecret);
  const supplied = Buffer.from(suppliedSecret);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function parseIcloudUrl(value: unknown) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value.trim());
    const isIcloudHost = url.hostname === 'icloud.com' || url.hostname.endsWith('.icloud.com');
    return url.protocol === 'https:' && isIcloudHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeTitle(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pickBestMatch(
  results: TmdbSearchResult[],
  query: string,
  mediaType: SharedMediaType,
  requestedYear: number | null,
) {
  const normalizedQuery = normalizeTitle(query);
  const queryTokens = new Set(normalizedQuery.split(' ').filter(Boolean));
  const scored = results.map((result) => {
    const title = mediaType === 'movie' ? result.title : result.name;
    const normalizedTitle = normalizeTitle(title ?? '');
    const titleTokens = new Set(normalizedTitle.split(' ').filter(Boolean));
    const overlap = [...queryTokens].filter((token) => titleTokens.has(token)).length;
    const union = new Set([...queryTokens, ...titleTokens]).size || 1;
    let confidence = (overlap / union) * 0.7;

    if (normalizedTitle === normalizedQuery) confidence = 0.9;
    else if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
      confidence = Math.max(confidence, 0.75);
    }

    const date = mediaType === 'movie' ? result.release_date : result.first_air_date;
    const resultYear = date ? Number(date.slice(0, 4)) : null;
    if (requestedYear && resultYear === requestedYear) confidence += 0.1;
    else if (requestedYear && resultYear && resultYear !== requestedYear) confidence -= 0.2;

    return { result, confidence: Math.max(0, Math.min(1, confidence)) };
  });

  return scored.sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}

function pickTrailer(videos: TmdbVideo[] = []) {
  const youtube = videos.filter((video) => video.site === 'YouTube' && video.key);
  const trailer =
    youtube.find((video) => video.type === 'Trailer' && video.official) ??
    youtube.find((video) => video.type === 'Trailer') ??
    youtube.find((video) => video.type === 'Teaser' && video.official) ??
    youtube[0];

  return trailer ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}` : null;
}

async function fetchTmdb<T>(path: string, apiKey: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`TMDB request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

function parseIngestItem(body: IngestBody): ParsedIngestItem {
  const rawQuery = typeof body.query === 'string' ? body.query.trim() : '';
  const mediaType: SharedMediaType | null = body.media_type === 'movie' || body.media_type === 'tv'
    ? body.media_type
    : null;
  const icloudLink = parseIcloudUrl(body.icloud_link);
  const linkScope: SharedMediaLinkScope | null = body.link_scope == null
    ? 'item'
    : body.link_scope === 'item' || body.link_scope === 'library'
      ? body.link_scope
      : null;
  const sourceKey = typeof body.source_key === 'string' && body.source_key.trim()
    ? body.source_key.trim().slice(0, 500)
    : null;
  const sourceName = typeof body.source_name === 'string' && body.source_name.trim()
    ? body.source_name.trim().slice(0, 500)
    : null;
  const rawReplacementKeys = Array.isArray(body.replaces_source_keys) ? body.replaces_source_keys : [];
  const replacesSourceKeys = [...new Set(rawReplacementKeys
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().slice(0, 500))
    .filter(Boolean))];
  const explicitYear = Number.isInteger(body.year) && Number(body.year) >= 1870 && Number(body.year) <= new Date().getFullYear() + 5
    ? Number(body.year)
    : null;
  const explicitSeason = Number.isInteger(body.season_number) && Number(body.season_number) >= 0
    ? Number(body.season_number)
    : null;

  if (!rawQuery || rawQuery.length > 200) {
    throw new IngestItemError('query must be between 1 and 200 characters', 400);
  }
  if (!mediaType) {
    throw new IngestItemError('media_type must be either movie or tv', 400);
  }
  if (!icloudLink) {
    throw new IngestItemError('icloud_link must be a valid HTTPS iCloud share URL', 400);
  }
  if (!linkScope) {
    throw new IngestItemError('link_scope must be either item or library', 400);
  }
  if (body.season_number != null && explicitSeason === null) {
    throw new IngestItemError('season_number must be a non-negative integer', 400);
  }
  if (mediaType === 'movie' && explicitSeason !== null) {
    throw new IngestItemError('season_number is only valid for TV media', 400);
  }
  if (body.year != null && explicitYear === null) {
    throw new IngestItemError('year must be a plausible four-digit year', 400);
  }
  if (body.replaces_source_keys != null && !Array.isArray(body.replaces_source_keys)) {
    throw new IngestItemError('replaces_source_keys must be an array of strings', 400);
  }
  if (rawReplacementKeys.some((value) => typeof value !== 'string' || value.trim().length === 0)) {
    throw new IngestItemError('replaces_source_keys must contain only non-empty strings', 400);
  }
  if (replacesSourceKeys.length > 100) {
    throw new IngestItemError('replaces_source_keys cannot contain more than 100 values', 400);
  }

  return {
    query: rawQuery,
    mediaType,
    icloudLink,
    linkScope,
    seasonNumber: mediaType === 'tv' ? explicitSeason : null,
    sourceKey,
    sourceName,
    replacesSourceKeys,
    year: explicitYear,
  };
}

function existingInput(existing: SharedMedia, item: ParsedIngestItem): SharedMediaInput {
  return {
    tmdb_id: existing.tmdb_id,
    media_type: existing.media_type,
    season_number: existing.season_number,
    title: existing.title,
    overview: existing.overview,
    poster_url: existing.poster_url,
    trailer_url: existing.trailer_url,
    icloud_link: item.icloudLink,
    link_scope: item.linkScope,
    genres: existing.genres,
    release_year: existing.release_year,
    runtime_minutes: existing.runtime_minutes,
    match_confidence: existing.match_confidence,
    match_status: existing.match_status,
    source_key: item.sourceKey,
    source_name: item.sourceName,
  };
}

async function enrichItem(item: ParsedIngestItem, apiKey: string): Promise<SharedMediaInput> {
  const seasonSuffix = item.mediaType === 'tv' ? item.query.match(/\s+season\s+(\d+)\s*$/i) : null;
  const inferredSeason = seasonSuffix ? Number(seasonSuffix[1]) : null;
  const seasonNumber = item.mediaType === 'tv' ? (item.seasonNumber ?? inferredSeason) : null;
  const queryWithoutSeason = seasonSuffix ? item.query.slice(0, seasonSuffix.index).trim() : item.query;
  const yearSuffix = queryWithoutSeason.match(/\s*\((\d{4})\)\s*$/);
  const searchQuery = yearSuffix
    ? queryWithoutSeason.slice(0, yearSuffix.index).trim()
    : queryWithoutSeason;
  const searchParams: Record<string, string> = { query: searchQuery, include_adult: 'false' };
  const requestedYear = item.year ?? (yearSuffix ? Number(yearSuffix[1]) : null);
  if (requestedYear) {
    searchParams[item.mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = String(requestedYear);
  }

  const search = await fetchTmdb<{ results?: TmdbSearchResult[] }>(
    `/search/${item.mediaType}`,
    apiKey,
    searchParams,
  );
  const match = pickBestMatch(search.results ?? [], searchQuery, item.mediaType, requestedYear);
  if (!match || match.confidence < 0.45) {
    throw new IngestItemError(
      `No confident ${item.mediaType === 'movie' ? 'movie' : 'TV series'} match found for “${searchQuery}”`,
      404,
    );
  }

  const details = await fetchTmdb<TmdbDetails>(`/${item.mediaType}/${match.result.id}`, apiKey, {
    append_to_response: 'videos',
  });
  const title = item.mediaType === 'movie' ? details.title : details.name;
  if (!title) throw new IngestItemError('TMDB returned incomplete title metadata', 502);

  const releaseDate = item.mediaType === 'movie' ? details.release_date : details.first_air_date;
  const runtime = item.mediaType === 'movie' ? details.runtime : details.episode_run_time?.[0];
  return {
    tmdb_id: details.id,
    media_type: item.mediaType,
    season_number: seasonNumber,
    title,
    overview: details.overview?.trim() || null,
    poster_url: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
    trailer_url: pickTrailer(details.videos?.results),
    icloud_link: item.icloudLink,
    link_scope: item.linkScope,
    genres: (details.genres ?? []).map((genre) => genre.name),
    release_year: releaseDate ? Number(releaseDate.slice(0, 4)) || null : null,
    runtime_minutes: typeof runtime === 'number' && runtime > 0 ? runtime : null,
    match_confidence: match.confidence,
    match_status: match.confidence >= 0.7 ? 'matched' : 'review',
    source_key: item.sourceKey,
    source_name: item.sourceName,
  };
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(request: Request) {
  const ingestSecret = process.env.INGEST_API_SECRET?.trim();
  const tmdbApiKey = process.env.TMDB_API_KEY?.trim();

  if (!ingestSecret || !tmdbApiKey) {
    return NextResponse.json({ error: 'Ingestion service is not configured' }, { status: 503 });
  }
  if (!hasValidSecret(request, ingestSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
  }

  const envelope = rawBody as IngestBody & { items?: unknown };
  const isBatch = envelope.items !== undefined;
  const rawItems = isBatch ? envelope.items : [envelope];
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `items must contain between 1 and ${MAX_BATCH_SIZE} entries` },
      { status: 400 },
    );
  }

  let items: ParsedIngestItem[];
  try {
    items = rawItems.map((value, index) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new IngestItemError(`item ${index + 1} must be a JSON object`, 400);
      }
      try {
        return parseIngestItem(value as IngestBody);
      } catch (error) {
        if (error instanceof IngestItemError) {
          throw new IngestItemError(`item ${index + 1}: ${error.message}`, error.status);
        }
        throw error;
      }
    });
    const sourceKeys = items.flatMap((item) => item.sourceKey ? [item.sourceKey] : []);
    if (new Set(sourceKeys).size !== sourceKeys.length) {
      throw new IngestItemError('items must not contain duplicate source_key values', 400);
    }
  } catch (error) {
    const status = error instanceof IngestItemError ? error.status : 400;
    const message = error instanceof Error ? error.message : 'Invalid ingestion request';
    return NextResponse.json({ error: message }, { status });
  }

  try {
    // Read once for the whole scan. Existing source records reuse their TMDB
    // metadata, so normal iCloud events do not repeat external API requests.
    const existingItems = await readSharedMedia();
    const existingBySource = new Map(existingItems.flatMap((item) =>
      item.source_key ? [[item.source_key, item] as const] : [],
    ));
    const resolved = await mapWithConcurrency(items, TMDB_CONCURRENCY, async (item) => {
      const existing = item.sourceKey ? existingBySource.get(item.sourceKey) : undefined;
      if (existing && existing.source_name === item.sourceName) {
        return { item, input: existingInput(existing, item), error: null };
      }
      try {
        return { item, input: await enrichItem(item, tmdbApiKey), error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not retrieve media metadata';
        return { item, input: null, error: message };
      }
    });

    const upserts: SharedMediaUpsert[] = resolved.flatMap(({ item, input }) => input ? [{
      input,
      replacesSourceKeys: item.replacesSourceKeys,
    }] : []);
    const failures = resolved.flatMap(({ item, error }) => error ? [{
      source_key: item.sourceKey,
      query: item.query,
      error,
    }] : []);
    const result = await reconcileSharedMedia(upserts, existingItems);

    if (!isBatch) {
      if (failures[0]) {
        const error = failures[0].error;
        const status = error.startsWith('No confident') ? 404 : 502;
        return NextResponse.json({ error }, { status });
      }
      return NextResponse.json(
        { data: result.items[0], created: result.created === 1, changed: result.changed },
        { status: result.created === 1 ? 201 : 200 },
      );
    }

    return NextResponse.json({
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      failed: failures.length,
      changed: result.changed,
      failures,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    console.error('Media ingestion failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: timedOut ? 'Catalogue request timed out' : 'Catalogue storage is unavailable' },
      { status: 503 },
    );
  }
}
