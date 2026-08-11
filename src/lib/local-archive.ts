'use client';

import { useSyncExternalStore } from 'react';
import type { ClassificationName } from '@/lib/design-tokens';
import type { UniversalMedia } from '@/lib/api/UniversalTransformer';
import type { AvatarAnimation, AvatarCharacter, AvatarMode } from '@/lib/avatar-character';

export const LOCAL_ARCHIVE_STORAGE_KEY = 'cinechive-local-archive-v1';
const LOCAL_ARCHIVE_EVENT = 'cinechive-local-archive-change';

export type LocalMediaType = UniversalMedia['type'] | 'documentary';
export type LocalPreferenceValue = 'like' | 'dislike';

export interface LocalProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  avatar_seed: string;
  avatar_mode: AvatarMode;
  avatar_character: AvatarCharacter;
  avatar_animation: AvatarAnimation;
  onboarding_completed: boolean;
  created_at: string;
  primary_style?: ClassificationName;
}

export interface LocalMediaEntry {
  id: string;
  external_id: string;
  media_type: LocalMediaType;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  classification: ClassificationName;
  comment: string | null;
  rating: number | null;
  is_vault: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalJournalEntry {
  id: string;
  media_id: string;
  media_type: LocalMediaType;
  title: string;
  poster_url: string | null;
  watched_at: string;
  is_rewatch: boolean;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface LocalCollectionItem {
  id: string;
  collection_id: string;
  media_id: string;
  media_type: LocalMediaType;
  title: string;
  poster_url: string | null;
  year: number | null;
  added_at: string;
}

export interface LocalCollection {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: false;
  created_at: string;
  updated_at: string;
  collection_items: LocalCollectionItem[];
}

export interface LocalPreference {
  id: string;
  media_id: string;
  media_type: LocalMediaType;
  reaction: LocalPreferenceValue;
  title: string;
  poster_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalReminder {
  id: string;
  media_id: string;
  media_type: LocalMediaType;
  title: string;
  poster_url: string | null;
  release_date: string | null;
  created_at: string;
}

export interface LocalArchivePreferences {
  reduced_motion: boolean;
  compact_view: boolean;
}

export interface LocalArchiveState {
  schemaVersion: 1;
  profile: LocalProfile;
  mediaEntries: LocalMediaEntry[];
  journalEntries: LocalJournalEntry[];
  collections: LocalCollection[];
  preferences: LocalPreference[];
  reminders: LocalReminder[];
  settings: LocalArchivePreferences;
  updatedAt: string;
}

export interface LocalAuthUser {
  id: string;
  email: null;
  isLocal: true;
  profile: LocalProfile;
  app_metadata: Record<string, never>;
  user_metadata: Record<string, never>;
  aud: 'local';
  created_at: string;
}

export interface LocalNotification {
  id: string;
  title: string;
  message: string;
  mediaId: string;
  mediaType: LocalMediaType;
  posterUrl: string | null;
  releaseDate: string | null;
  createdAt: string;
}

type LocalMediaInput = {
  mediaId: string;
  mediaType: string;
  title?: string;
  posterUrl?: string | null;
  releaseYear?: number | null;
  releaseDate?: string | null;
};

const now = () => new Date().toISOString();

function randomId(prefix: string) {
  const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

function createDefaultState(deterministic = false): LocalArchiveState {
  const createdAt = deterministic ? '1970-01-01T00:00:00.000Z' : now();
  const userId = deterministic ? 'local-user-device' : randomId('local-user');
  return {
    schemaVersion: 1,
    profile: {
      id: userId,
      username: 'local-curator',
      display_name: 'Local Curator',
      bio: 'A private CineChive archive stored on this device.',
      avatar_url: '',
      avatar_seed: deterministic ? 'cinechive-local' : randomId('seed'),
      avatar_mode: 'character',
      avatar_character: 'cyber-noir',
      avatar_animation: 'float',
      onboarding_completed: true,
      created_at: createdAt,
      primary_style: 'Atmospheric',
    },
    mediaEntries: [],
    journalEntries: [],
    collections: [],
    preferences: [],
    reminders: [],
    settings: {
      reduced_motion: false,
      compact_view: false,
    },
    updatedAt: createdAt,
  };
}

const SERVER_STATE = createDefaultState(true);
let cachedState: LocalArchiveState | null = null;

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeState(value: unknown): LocalArchiveState {
  if (!value || typeof value !== 'object') return createDefaultState();
  const candidate = value as Partial<LocalArchiveState>;
  const fallback = createDefaultState();
  const profile = candidate.profile && typeof candidate.profile === 'object'
    ? { ...fallback.profile, ...candidate.profile }
    : fallback.profile;

  return {
    schemaVersion: 1,
    profile,
    mediaEntries: Array.isArray(candidate.mediaEntries) ? candidate.mediaEntries : [],
    journalEntries: Array.isArray(candidate.journalEntries) ? candidate.journalEntries : [],
    collections: Array.isArray(candidate.collections)
      ? candidate.collections.map((collection) => ({
          ...collection,
          is_public: false as const,
          collection_items: Array.isArray(collection.collection_items) ? collection.collection_items : [],
        }))
      : [],
    preferences: Array.isArray(candidate.preferences) ? candidate.preferences : [],
    reminders: Array.isArray(candidate.reminders) ? candidate.reminders : [],
    settings: { ...fallback.settings, ...(candidate.settings || {}) },
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : fallback.updatedAt,
  };
}

export function getLocalArchive(): LocalArchiveState {
  if (!isBrowser()) return SERVER_STATE;
  if (cachedState) return cachedState;

  const stored = localStorage.getItem(LOCAL_ARCHIVE_STORAGE_KEY);
  if (!stored) {
    cachedState = createDefaultState();
    localStorage.setItem(LOCAL_ARCHIVE_STORAGE_KEY, JSON.stringify(cachedState));
    return cachedState;
  }

  try {
    cachedState = normalizeState(JSON.parse(stored));
  } catch {
    cachedState = createDefaultState();
    localStorage.setItem(LOCAL_ARCHIVE_STORAGE_KEY, JSON.stringify(cachedState));
  }
  return cachedState;
}

function emitArchiveChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(LOCAL_ARCHIVE_EVENT));
}

function writeState(next: LocalArchiveState) {
  if (!isBrowser()) return next;
  cachedState = { ...next, updatedAt: now() };
  try {
    localStorage.setItem(LOCAL_ARCHIVE_STORAGE_KEY, JSON.stringify(cachedState));
  } catch (error) {
    cachedState = getLocalArchive();
    throw new Error(error instanceof DOMException && error.name === 'QuotaExceededError'
      ? 'This browser archive is full. Export or remove some data and try again.'
      : 'CineChive could not save data in this browser.');
  }
  emitArchiveChange();
  return cachedState;
}

function mutateState(mutator: (current: LocalArchiveState) => LocalArchiveState) {
  return writeState(mutator(getLocalArchive()));
}

export function subscribeToLocalArchive(callback: () => void) {
  if (!isBrowser()) return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LOCAL_ARCHIVE_STORAGE_KEY) return;
    cachedState = null;
    callback();
  };
  window.addEventListener(LOCAL_ARCHIVE_EVENT, callback);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(LOCAL_ARCHIVE_EVENT, callback);
    window.removeEventListener('storage', handleStorage);
  };
}

export function useLocalArchive() {
  return useSyncExternalStore(subscribeToLocalArchive, getLocalArchive, () => SERVER_STATE);
}

export function getLocalAuthUser(state = getLocalArchive()): LocalAuthUser {
  return {
    id: state.profile.id,
    email: null,
    isLocal: true,
    profile: state.profile,
    app_metadata: {},
    user_metadata: {},
    aud: 'local',
    created_at: state.profile.created_at,
  };
}

export function updateLocalProfile(patch: Partial<Omit<LocalProfile, 'id' | 'created_at'>>) {
  return mutateState((current) => ({
    ...current,
    profile: { ...current.profile, ...patch },
  })).profile;
}

function mediaKey(mediaId: string, mediaType: string) {
  return `${mediaType}:${mediaId}`;
}

export function getLocalMediaEntry(mediaId: string, mediaType: string, state = getLocalArchive()) {
  const key = mediaKey(mediaId, mediaType);
  return state.mediaEntries.find((entry) => mediaKey(entry.external_id, entry.media_type) === key) || null;
}

export function archiveLocalMedia(input: LocalMediaInput & {
  classification?: ClassificationName;
  comment?: string;
  rating?: number;
  isVault?: boolean;
}) {
  let saved: LocalMediaEntry | null = null;
  mutateState((current) => {
    const existing = getLocalMediaEntry(input.mediaId, input.mediaType, current);
    const timestamp = now();
    saved = {
      id: existing?.id || randomId('entry'),
      external_id: input.mediaId,
      media_type: input.mediaType as LocalMediaType,
      title: input.title || existing?.title || 'Untitled',
      poster_url: input.posterUrl === undefined ? existing?.poster_url || null : input.posterUrl,
      release_year: input.releaseYear === undefined ? existing?.release_year || null : input.releaseYear,
      classification: input.classification || existing?.classification || 'Atmospheric',
      comment: input.comment === undefined ? existing?.comment || null : input.comment || null,
      rating: input.rating === undefined ? existing?.rating || null : input.rating || null,
      is_vault: input.isVault ?? existing?.is_vault ?? true,
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    return {
      ...current,
      mediaEntries: [saved!, ...current.mediaEntries.filter((entry) => entry.id !== saved!.id)],
    };
  });
  return saved!;
}

export function removeLocalMediaEntry(mediaId: string, mediaType: string) {
  mutateState((current) => ({
    ...current,
    mediaEntries: current.mediaEntries.filter(
      (entry) => mediaKey(entry.external_id, entry.media_type) !== mediaKey(mediaId, mediaType),
    ),
  }));
}

export function toggleLocalVault(input: LocalMediaInput) {
  const existing = getLocalMediaEntry(input.mediaId, input.mediaType);
  const isVault = !(existing?.is_vault ?? false);
  archiveLocalMedia({ ...input, isVault });
  return isVault;
}

export function getLocalPreference(mediaId: string, mediaType: string, state = getLocalArchive()) {
  return state.preferences.find(
    (preference) => mediaKey(preference.media_id, preference.media_type) === mediaKey(mediaId, mediaType),
  ) || null;
}

export function setLocalPreference(input: LocalMediaInput & { reaction: LocalPreferenceValue | null }) {
  mutateState((current) => {
    const existing = getLocalPreference(input.mediaId, input.mediaType, current);
    const remaining = current.preferences.filter((preference) => preference.id !== existing?.id);
    if (!input.reaction) return { ...current, preferences: remaining };
    const timestamp = now();
    const preference: LocalPreference = {
      id: existing?.id || randomId('preference'),
      media_id: input.mediaId,
      media_type: input.mediaType as LocalMediaType,
      reaction: input.reaction,
      title: input.title || existing?.title || 'Untitled',
      poster_url: input.posterUrl === undefined ? existing?.poster_url || null : input.posterUrl,
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    return { ...current, preferences: [preference, ...remaining] };
  });
}

export function getLocalReminder(mediaId: string, mediaType: string, state = getLocalArchive()) {
  return state.reminders.find(
    (reminder) => mediaKey(reminder.media_id, reminder.media_type) === mediaKey(mediaId, mediaType),
  ) || null;
}

export function toggleLocalReminder(input: LocalMediaInput) {
  let added = false;
  mutateState((current) => {
    const existing = getLocalReminder(input.mediaId, input.mediaType, current);
    if (existing) {
      return { ...current, reminders: current.reminders.filter((reminder) => reminder.id !== existing.id) };
    }
    added = true;
    const reminder: LocalReminder = {
      id: randomId('reminder'),
      media_id: input.mediaId,
      media_type: input.mediaType as LocalMediaType,
      title: input.title || 'Upcoming release',
      poster_url: input.posterUrl || null,
      release_date: input.releaseDate || null,
      created_at: now(),
    };
    return { ...current, reminders: [reminder, ...current.reminders] };
  });
  return added;
}

export function logLocalScreening(input: LocalMediaInput & {
  watchedAt: string;
  isRewatch?: boolean;
  rating?: number;
  notes?: string;
}) {
  const entry: LocalJournalEntry = {
    id: randomId('journal'),
    media_id: input.mediaId,
    media_type: input.mediaType as LocalMediaType,
    title: input.title || 'Untitled',
    poster_url: input.posterUrl || null,
    watched_at: input.watchedAt,
    is_rewatch: !!input.isRewatch,
    rating: input.rating || null,
    notes: input.notes || null,
    created_at: now(),
  };
  mutateState((current) => ({ ...current, journalEntries: [entry, ...current.journalEntries] }));
  return entry;
}

export function removeLocalJournalEntry(id: string) {
  mutateState((current) => ({
    ...current,
    journalEntries: current.journalEntries.filter((entry) => entry.id !== id),
  }));
}

export function clearLocalHistory() {
  mutateState((current) => ({ ...current, journalEntries: [] }));
}

export function createLocalCollection(input: { title: string; description?: string }) {
  const timestamp = now();
  const collection: LocalCollection = {
    id: randomId('collection'),
    user_id: getLocalArchive().profile.id,
    title: input.title.trim(),
    description: input.description?.trim() || '',
    is_public: false,
    created_at: timestamp,
    updated_at: timestamp,
    collection_items: [],
  };
  mutateState((current) => ({ ...current, collections: [collection, ...current.collections] }));
  return collection;
}

export function deleteLocalCollection(id: string) {
  mutateState((current) => ({
    ...current,
    collections: current.collections.filter((collection) => collection.id !== id),
  }));
}

export function addLocalMediaToCollection(collectionId: string, input: LocalMediaInput) {
  let wasAdded = false;
  mutateState((current) => ({
    ...current,
    collections: current.collections.map((collection) => {
      if (collection.id !== collectionId) return collection;
      const exists = collection.collection_items.some(
        (item) => mediaKey(item.media_id, item.media_type) === mediaKey(input.mediaId, input.mediaType),
      );
      if (exists) return collection;
      wasAdded = true;
      const item: LocalCollectionItem = {
        id: randomId('collection-item'),
        collection_id: collectionId,
        media_id: input.mediaId,
        media_type: input.mediaType as LocalMediaType,
        title: input.title || 'Untitled',
        poster_url: input.posterUrl || null,
        year: input.releaseYear || null,
        added_at: now(),
      };
      return {
        ...collection,
        updated_at: now(),
        collection_items: [item, ...collection.collection_items],
      };
    }),
  }));
  return wasAdded;
}

export function removeLocalMediaFromCollection(collectionId: string, itemId: string) {
  mutateState((current) => ({
    ...current,
    collections: current.collections.map((collection) => collection.id === collectionId
      ? {
          ...collection,
          updated_at: now(),
          collection_items: collection.collection_items.filter((item) => item.id !== itemId),
        }
      : collection),
  }));
}

export function getLocalCollection(id: string, state = getLocalArchive()) {
  return state.collections.find((collection) => collection.id === id) || null;
}

export function updateLocalSettings(patch: Partial<LocalArchivePreferences>) {
  return mutateState((current) => ({
    ...current,
    settings: { ...current.settings, ...patch },
  })).settings;
}

export function getLocalNotifications(state = getLocalArchive()): LocalNotification[] {
  return state.reminders
    .map((reminder) => {
      const release = reminder.release_date ? new Date(reminder.release_date) : null;
      const days = release && !Number.isNaN(release.getTime())
        ? Math.ceil((release.getTime() - Date.now()) / 86_400_000)
        : null;
      const message = days === null
        ? 'You asked CineChive to keep this release on your radar.'
        : days < 0
          ? 'This title has been released.'
          : days === 0
            ? 'This title releases today.'
            : `Releases in ${days} day${days === 1 ? '' : 's'}.`;
      return {
        id: reminder.id,
        title: reminder.title,
        message,
        mediaId: reminder.media_id,
        mediaType: reminder.media_type,
        posterUrl: reminder.poster_url,
        releaseDate: reminder.release_date,
        createdAt: reminder.created_at,
      };
    })
    .sort((a, b) => {
      const aDate = a.releaseDate ? new Date(a.releaseDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.releaseDate ? new Date(b.releaseDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
}

export function mapLocalMediaEntry(entry: LocalMediaEntry): UniversalMedia {
  const supportedType: UniversalMedia['type'] = entry.media_type === 'documentary'
    ? 'movie'
    : entry.media_type;
  return {
    id: entry.external_id,
    sourceId: entry.external_id,
    source: supportedType === 'anime' ? 'anilist' : 'tmdb',
    type: supportedType,
    displayTitle: entry.title,
    overview: entry.comment || '',
    posterUrl: entry.poster_url,
    backdropUrl: null,
    classification: entry.classification,
    genres: [],
    releaseYear: entry.release_year,
    releaseDate: null,
    status: null,
    rating: {
      average: entry.rating || 0,
      count: entry.rating ? 1 : 0,
      showBadge: !!entry.rating,
    },
    popularity: 0,
  };
}

export function exportLocalArchive() {
  return JSON.stringify(getLocalArchive(), null, 2);
}

export function importLocalArchive(raw: string) {
  const parsed = normalizeState(JSON.parse(raw));
  return writeState(parsed);
}

export function resetLocalArchive() {
  return writeState(createDefaultState());
}

export async function resizeAvatarForLocalStorage(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Avatar must be under 8MB.');

  const bitmap = await createImageBitmap(file);
  const maxSize = 384;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot process that image.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.78);
}
