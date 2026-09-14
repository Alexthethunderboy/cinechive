import 'server-only';

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { get, put } from '@vercel/blob';
import { hasUpstashStorage, runUpstashCommand } from '@/lib/upstash-rest';

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

export interface SharedMediaUpsert {
  input: SharedMediaInput;
  replacesSourceKeys?: string[];
}

export interface SharedMediaReconcileResult {
  items: SharedMedia[];
  createdItems: SharedMedia[];
  created: number;
  updated: number;
  unchanged: number;
  changed: boolean;
}

const REDIS_CATALOG_KEY = 'cinechive:shared-media:v3';
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
  if (hasUpstashStorage()) {
    const raw = await runUpstashCommand<string | null>(['GET', REDIS_CATALOG_KEY]);
    return raw === null ? emptyStore() : parseStore(raw);
  }

  // Keep the former Blob path available as a rollback source during migration.
  if (usesBlobStorage()) {
    const result = await get(BLOB_PATHNAME, { access: 'private', useCache: false });
    if (!result) return emptyStore();
    if (result.statusCode !== 200 || !result.stream) {
      throw new Error(`Private Blob read failed with status ${result.statusCode}`);
    }
    return parseStore(await new Response(result.stream).text());
  }

  // Never silently write catalogue data to Vercel's temporary filesystem.
  if (process.env.VERCEL) {
    throw new Error('Upstash Redis is not configured for the shared catalogue');
  }
  return readLocalStore();
}

async function writeStore(store: SharedMediaFile) {
  const serialized = `${JSON.stringify(store, null, 2)}\n`;
  if (hasUpstashStorage()) {
    await runUpstashCommand<'OK'>(['SET', REDIS_CATALOG_KEY, serialized]);
    return;
  }

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
    throw new Error('Upstash Redis is not configured for the shared catalogue');
  }
  await writeLocalStore(store);
}

function mediaIdentity(item: Pick<SharedMediaInput, 'media_type' | 'tmdb_id' | 'season_number'>) {
  return `${item.media_type}:${item.tmdb_id}:${item.season_number ?? 'all'}`;
}

function hasSamePayload(item: SharedMedia, input: SharedMediaInput) {
  return item.tmdb_id === input.tmdb_id &&
    item.media_type === input.media_type &&
    item.season_number === input.season_number &&
    item.title === input.title &&
    item.overview === input.overview &&
    item.poster_url === input.poster_url &&
    item.trailer_url === input.trailer_url &&
    item.icloud_link === input.icloud_link &&
    item.link_scope === input.link_scope &&
    JSON.stringify(item.genres) === JSON.stringify(input.genres) &&
    item.release_year === input.release_year &&
    item.runtime_minutes === input.runtime_minutes &&
    item.match_confidence === input.match_confidence &&
    item.match_status === input.match_status &&
    item.source_key === input.source_key &&
    item.source_name === input.source_name;
}

export async function readSharedMedia() {
  const store = await readStore();
  return [...store.items].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function reconcileSharedMedia(
  upserts: SharedMediaUpsert[],
  currentItems?: SharedMedia[],
): Promise<SharedMediaReconcileResult> {
  const operation = writeQueue.then(async () => {
    // Bulk ingestion already has a fresh snapshot for metadata reuse. Accepting
    // it here prevents a second Redis read during the same request.
    const store: SharedMediaFile = currentItems
      ? { schema_version: 3, items: [...currentItems] }
      : await readStore();
    const resultItems: SharedMedia[] = [];
    const createdItems: SharedMedia[] = [];
    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let changed = false;

    for (const { input: rawInput, replacesSourceKeys = [] } of upserts) {
      const identity = mediaIdentity(rawInput);
      const replacementKeys = new Set(replacesSourceKeys.filter((key) => key !== rawInput.source_key));
      const sourceIndex = rawInput.source_key
        ? store.items.findIndex((item) => item.source_key === rawInput.source_key)
        : -1;
      const identityIndex = store.items.findIndex((item) => mediaIdentity(item) === identity);
      const replacementIndex = store.items.findIndex((item) => item.source_key !== null && replacementKeys.has(item.source_key));
      const existingIndex = sourceIndex >= 0 ? sourceIndex : identityIndex >= 0 ? identityIndex : replacementIndex;
      const existing = existingIndex >= 0 ? store.items[existingIndex] : null;
      const preserveDirectLink = existing?.link_scope === 'item' && rawInput.link_scope === 'library';
      const input: SharedMediaInput = {
        ...rawInput,
        icloud_link: preserveDirectLink ? existing.icloud_link : rawInput.icloud_link,
        link_scope: preserveDirectLink ? existing.link_scope : rawInput.link_scope,
      };
      const duplicateIndexes = new Set<number>();

      store.items.forEach((candidate, index) => {
        if (index === existingIndex) return;
        const isDuplicateIdentity = mediaIdentity(candidate) === identity;
        const isReplacedSource = candidate.source_key !== null && replacementKeys.has(candidate.source_key);
        if (isDuplicateIdentity || isReplacedSource) duplicateIndexes.add(index);
      });

      if (existing && hasSamePayload(existing, input) && duplicateIndexes.size === 0) {
        unchanged += 1;
        resultItems.push(existing);
        continue;
      }

      const timestamp = new Date().toISOString();
      const item: SharedMedia = {
        ...input,
        id: existing?.id ?? randomUUID(),
        created_at: existing?.created_at ?? timestamp,
        updated_at: timestamp,
      };

      if (existingIndex >= 0) store.items[existingIndex] = item;
      else store.items.push(item);
      if (duplicateIndexes.size > 0) {
        store.items = store.items.filter((_, index) => !duplicateIndexes.has(index));
      }

      changed = true;
      if (existing) updated += 1;
      else {
        created += 1;
        createdItems.push(item);
      }
      resultItems.push(item);
    }

    if (changed) await writeStore(store);
    return { items: resultItems, createdItems, created, updated, unchanged, changed };
  });

  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function upsertSharedMedia(input: SharedMediaInput, replacesSourceKeys: string[] = []) {
  const result = await reconcileSharedMedia([{ input, replacesSourceKeys }]);
  return { item: result.items[0], created: result.created === 1, changed: result.changed };
}
