import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { get, put } from '@vercel/blob';

export type SharedMediaType = 'movie' | 'tv';
export type SharedMediaMatchStatus = 'matched' | 'review';
export type SharedMediaLinkScope = 'item' | 'library';

export interface SharedMedia {
  id: string;
  tmdb_id: number;
  media_type: SharedMediaType;
  season_number: number | null;
  title: string;
  overview: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  icloud_link: string;
  link_scope: SharedMediaLinkScope;
  genres: string[];
  release_year: number | null;
  runtime_minutes: number | null;
  match_confidence: number;
  match_status: SharedMediaMatchStatus;
  source_key: string | null;
  source_name: string | null;
  created_at: string;
  updated_at: string;
}

interface SharedMediaFile {
  schema_version: 3;
  items: SharedMedia[];
}

export type SharedMediaInput = Omit<SharedMedia, 'id' | 'created_at' | 'updated_at'>;

const BLOB_PATHNAME = 'cinechive/shared-media.json';
let writeQueue: Promise<void> = Promise.resolve();

function getLocalStorePath() {
  const configuredPath = process.env.SHARED_MEDIA_DATA_FILE?.trim();
  return configuredPath
    ? path.resolve(configuredPath)
    : path.join(process.cwd(), 'data', 'shared-media.json');
}

function usesBlobStorage() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_STORE_ID?.trim(),
  );
}

function emptyStore(): SharedMediaFile {
  return { schema_version: 3, items: [] };
}

function normalizeItem(value: unknown): SharedMedia | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<SharedMedia>;
  if (
    typeof item.id !== 'string' ||
    typeof item.tmdb_id !== 'number' ||
    (item.media_type !== 'movie' && item.media_type !== 'tv') ||
    typeof item.title !== 'string' ||
    typeof item.icloud_link !== 'string' ||
    typeof item.created_at !== 'string' ||
    typeof item.updated_at !== 'string'
  ) {
    return null;
  }

  return {
    id: item.id,
    tmdb_id: item.tmdb_id,
    media_type: item.media_type,
    season_number: typeof item.season_number === 'number' ? item.season_number : null,
    title: item.title,
    overview: typeof item.overview === 'string' ? item.overview : null,
    poster_url: typeof item.poster_url === 'string' ? item.poster_url : null,
    trailer_url: typeof item.trailer_url === 'string' ? item.trailer_url : null,
    icloud_link: item.icloud_link,
    link_scope: item.link_scope === 'item' ? 'item' : 'library',
    genres: Array.isArray(item.genres) ? item.genres.filter((genre): genre is string => typeof genre === 'string') : [],
    release_year: typeof item.release_year === 'number' ? item.release_year : null,
    runtime_minutes: typeof item.runtime_minutes === 'number' ? item.runtime_minutes : null,
    match_confidence: typeof item.match_confidence === 'number' ? item.match_confidence : 1,
    match_status: item.match_status === 'review' ? 'review' : 'matched',
    source_key: typeof item.source_key === 'string' ? item.source_key : null,
    source_name: typeof item.source_name === 'string' ? item.source_name : null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function parseStore(raw: string): SharedMediaFile {
  const parsed = JSON.parse(raw) as { items?: unknown };
  if (!Array.isArray(parsed.items)) throw new Error('Shared media data has an invalid schema');
  const items = parsed.items.map(normalizeItem);
  if (items.some((item) => item === null)) throw new Error('Shared media data contains an invalid item');
  return { schema_version: 3, items: items as SharedMedia[] };
}

async function readLocalStore() {
  try {
    return parseStore(await readFile(getLocalStorePath(), 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyStore();
    throw error;
  }
}

async function writeLocalStore(store: SharedMediaFile) {
  const storePath = getLocalStorePath();
  const directory = path.dirname(storePath);
  const temporaryPath = path.join(directory, `.shared-media-${process.pid}-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, storePath);
}

async function readStore(): Promise<SharedMediaFile> {
  if (usesBlobStorage()) {
    const result = await get(BLOB_PATHNAME, { access: 'private', useCache: false });
    if (!result) return emptyStore();
    if (result.statusCode !== 200 || !result.stream) {
      throw new Error(`Private Blob read failed with status ${result.statusCode}`);
    }
    return parseStore(await new Response(result.stream).text());
  }

  // Never silently write catalog data to Vercel's temporary filesystem.
  if (process.env.VERCEL) {
    throw new Error('Private Vercel Blob is not configured for the shared catalog');
  }
  return readLocalStore();
}

async function writeStore(store: SharedMediaFile) {
  const serialized = `${JSON.stringify(store, null, 2)}\n`;
  if (usesBlobStorage()) {
    await put(BLOB_PATHNAME, serialized, {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });
    return;
  }

  if (process.env.VERCEL) {
    throw new Error('Private Vercel Blob is not configured for the shared catalog');
  }
  await writeLocalStore(store);
}

export async function readSharedMedia() {
  const store = await readStore();
  return [...store.items].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function findSharedMediaBySourceKey(sourceKey: string) {
  const store = await readStore();
  return store.items.find((item) => item.source_key === sourceKey) ?? null;
}

export function updateSharedMediaLink(
  sourceKey: string,
  icloudLink: string,
  linkScope: SharedMediaLinkScope,
) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const existingIndex = store.items.findIndex((item) => item.source_key === sourceKey);
    if (existingIndex < 0) return null;
    const item = {
      ...store.items[existingIndex],
      icloud_link: icloudLink,
      link_scope: linkScope,
      updated_at: new Date().toISOString(),
    };
    store.items[existingIndex] = item;
    await writeStore(store);
    return item;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}
export function upsertSharedMedia(input: SharedMediaInput) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const identity = `${input.media_type}:${input.tmdb_id}:${input.season_number ?? 'all'}`;
    const existingIndex = store.items.findIndex((item) => {
      const itemIdentity = `${item.media_type}:${item.tmdb_id}:${item.season_number ?? 'all'}`;
      return (input.source_key && item.source_key === input.source_key) || itemIdentity === identity;
    });
    const timestamp = new Date().toISOString();
    const existing = existingIndex >= 0 ? store.items[existingIndex] : null;
    const item: SharedMedia = {
      ...input,
      id: existing?.id ?? randomUUID(),
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
    };

    if (existingIndex >= 0) store.items[existingIndex] = item;
    else store.items.push(item);
    await writeStore(store);
    return { item, created: existingIndex < 0 };
  });

  // The scanner sends sequential requests. This queue also protects concurrent
  // writes handled by the same local or Vercel function instance.
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}
