'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ClassificationName } from './design-tokens';
import { toCanonicalMediaId } from './media-identity';

export async function archiveMediaAction(data: {
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string | null;
  classification: ClassificationName;
  comment?: string;
  rating?: number;
  isVault?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase.from('media_entries').upsert({
    user_id: user.id,
    external_id: data.mediaId,
    media_type: data.mediaType as any,
    title: data.title,
    poster_url: data.posterUrl,
    notes: data.comment,
    is_vault: data.isVault !== undefined ? data.isVault : true
  });

  if (error) return { error: error.message };
  revalidatePath('/vault');
  return { success: true };
}

export async function removeMediaEntryAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await (supabase as any)
    .from('media_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('external_id', mediaId);

  if (error) {
    console.error("Removal failed:", error);
    return { error: error.message };
  }

  revalidatePath('/vault');
  revalidatePath('/notifications');
  revalidatePath(`/media/${mediaType}/${mediaId}`);
  return { success: true };
}

export async function toggleArchiveMediaAction(data: {
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { data: existing } = await supabase.from('media_entries')
    .select('id, is_vault')
    .eq('user_id', user.id)
    .eq('external_id', data.mediaId)
    .maybeSingle();

  if (existing?.is_vault) {
    await removeMediaEntryAction(data.mediaId, data.mediaType);
    return { isVault: false };
  } else {
    await archiveMediaAction({
      mediaId: data.mediaId,
      mediaType: data.mediaType,
      title: data.title,
      posterUrl: data.posterUrl,
      classification: 'Atmospheric' as ClassificationName,
      isVault: true
    });
    return { isVault: true };
  }
}

export async function getIsInVaultAction(mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await (supabase as any)
    .from('media_entries')
    .select('is_vault')
    .eq('user_id', user.id)
    .eq('external_id', mediaId)
    .eq('is_vault', true)
    .maybeSingle();

  return !!data?.is_vault;
}

export async function getSavedVaultMediaKeysAction(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('media_entries')
    .select('media_type, external_id')
    .eq('user_id', user.id)
    .eq('is_vault', true);

  if (error || !data) return [];
  const keys = new Set<string>();
  for (const row of data) {
    const rawId = String(row.external_id || '');
    const canonicalId = toCanonicalMediaId({ id: rawId, type: row.media_type });
    keys.add(`${row.media_type}:${rawId}`);
    keys.add(`${row.media_type}:${canonicalId}`);
  }
  return Array.from(keys);
}

export async function getVaultEntries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from('media_entries')
    .select(`
      *,
      mood_tags (label)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Vault fetch failed:", error);
    return [];
  }

  return (data as any[]).map(item => ({
    ...item,
    id: item.id,
    sourceId: item.external_id,
    source: 'tmdb', // Defaulting to tmdb as most vault items are tmdb-based, or add source column if exists
    type: item.media_type,
    displayTitle: item.title,
    posterUrl: item.poster_url,
    releaseYear: item.year,
    classification: item.mood_tags?.label || 'Atmospheric',
  }));
}

