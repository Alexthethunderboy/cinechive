import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  findSharedMediaBySourceKey,
  updateSharedMediaLink,
  upsertSharedMedia,
  type SharedMediaLinkScope,
  type SharedMediaType,
} from '@/lib/shared-media-store';

export const runtime = 'nodejs';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface IngestBody {
  query?: unknown;
  media_type?: unknown;
  icloud_link?: unknown;
  link_scope?: unknown;
  season_number?: unknown;
  source_key?: unknown;
  source_name?: unknown;
  year?: unknown;
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

export async function POST(request: Request) {
  const ingestSecret = process.env.INGEST_API_SECRET?.trim();
  const tmdbApiKey = process.env.TMDB_API_KEY?.trim();

  if (!ingestSecret) {
    return NextResponse.json({ error: 'Ingestion service is not configured' }, { status: 503 });
  }
  if (!hasValidSecret(request, ingestSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!tmdbApiKey) {
    return NextResponse.json({ error: 'Ingestion service is not configured' }, { status: 503 });
  }

  let body: IngestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

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
  const explicitYear = Number.isInteger(body.year) && Number(body.year) >= 1870 && Number(body.year) <= new Date().getFullYear() + 5
    ? Number(body.year)
    : null;

  if (!rawQuery || rawQuery.length > 200) {
    return NextResponse.json({ error: 'query must be between 1 and 200 characters' }, { status: 400 });
  }
  if (!mediaType) {
    return NextResponse.json({ error: 'media_type must be either movie or tv' }, { status: 400 });
  }
  if (!icloudLink) {
    return NextResponse.json({ error: 'icloud_link must be a valid HTTPS iCloud share URL' }, { status: 400 });
  }
  if (!linkScope) {
    return NextResponse.json({ error: 'link_scope must be either item or library' }, { status: 400 });
  }

  const explicitSeason = Number.isInteger(body.season_number) && Number(body.season_number) >= 0
    ? Number(body.season_number)
    : null;
  if (body.season_number != null && explicitSeason === null) {
    return NextResponse.json({ error: 'season_number must be a non-negative integer' }, { status: 400 });
  }
  if (mediaType === 'movie' && explicitSeason !== null) {
    return NextResponse.json({ error: 'season_number is only valid for TV media' }, { status: 400 });
  }
  if (body.year != null && explicitYear === null) {
    return NextResponse.json({ error: 'year must be a plausible four-digit year' }, { status: 400 });
  }

  try {
    // The scanner sends a stable path-derived key. Return before hitting TMDB when
    // the same iCloud folder is observed again during a later scan.
    if (sourceKey) {
      const existing = await findSharedMediaBySourceKey(sourceKey);
      if (existing && existing.source_name === sourceName) {
        // A library-wide fallback from a later scanner run must never replace
        // a direct item link previously supplied by a Shortcut or sidecar.
        if (existing.link_scope === 'item' && linkScope === 'library') {
          return NextResponse.json({ data: existing, created: false }, { status: 200 });
        }
        const data = existing.icloud_link === icloudLink && existing.link_scope === linkScope
          ? existing
          : await updateSharedMediaLink(sourceKey, icloudLink, linkScope);
        return NextResponse.json({ data, created: false }, { status: 200 });
      }
    }

    const seasonSuffix = mediaType === 'tv' ? rawQuery.match(/\s+season\s+(\d+)\s*$/i) : null;
    const inferredSeason = seasonSuffix ? Number(seasonSuffix[1]) : null;
    const seasonNumber = mediaType === 'tv' ? (explicitSeason ?? inferredSeason) : null;
    const queryWithoutSeason = seasonSuffix ? rawQuery.slice(0, seasonSuffix.index).trim() : rawQuery;
    const yearSuffix = queryWithoutSeason.match(/\s*\((\d{4})\)\s*$/);
    const searchQuery = yearSuffix
      ? queryWithoutSeason.slice(0, yearSuffix.index).trim()
      : queryWithoutSeason;
    const searchParams: Record<string, string> = { query: searchQuery, include_adult: 'false' };
    const requestedYear = explicitYear ?? (yearSuffix ? Number(yearSuffix[1]) : null);
    if (requestedYear) {
      searchParams[mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = String(requestedYear);
    }

    const search = await fetchTmdb<{ results?: TmdbSearchResult[] }>(
      `/search/${mediaType}`,
      tmdbApiKey,
      searchParams,
    );
    const match = pickBestMatch(search.results ?? [], searchQuery, mediaType, requestedYear);
    if (!match) {
      return NextResponse.json(
        { error: `No ${mediaType === 'movie' ? 'movie' : 'TV series'} found for “${searchQuery}”` },
        { status: 404 },
      );
    }

    const details = await fetchTmdb<TmdbDetails>(`/${mediaType}/${match.result.id}`, tmdbApiKey, {
      append_to_response: 'videos',
    });
    const title = mediaType === 'movie' ? details.title : details.name;
    if (!title) {
      return NextResponse.json({ error: 'TMDB returned incomplete title metadata' }, { status: 502 });
    }

    const releaseDate = mediaType === 'movie' ? details.release_date : details.first_air_date;
    const runtime = mediaType === 'movie' ? details.runtime : details.episode_run_time?.[0];
    const result = await upsertSharedMedia({
      tmdb_id: details.id,
      media_type: mediaType,
      season_number: seasonNumber,
      title,
      overview: details.overview?.trim() || null,
      poster_url: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      trailer_url: pickTrailer(details.videos?.results),
      icloud_link: icloudLink,
      link_scope: linkScope,
      genres: (details.genres ?? []).map((genre) => genre.name),
      release_year: releaseDate ? Number(releaseDate.slice(0, 4)) || null : null,
      runtime_minutes: typeof runtime === 'number' && runtime > 0 ? runtime : null,
      match_confidence: match.confidence,
      match_status: match.confidence >= 0.7 ? 'matched' : 'review',
      source_key: sourceKey,
      source_name: sourceName,
    });

    return NextResponse.json(
      { data: result.item, created: result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    console.error('Media ingestion failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: timedOut ? 'TMDB request timed out' : 'Could not retrieve or store media metadata' },
      { status: 502 },
    );
  }
}
