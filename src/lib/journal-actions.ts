'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function logScreeningAction(data: {
  mediaId: string;
  mediaType: string;
  title: string;
  posterUrl: string | null;
  watchedAt: string;
  isRewatch: boolean;
  rating?: number;
  reviewText?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await (supabase.from('cine_journal') as any).insert({
    user_id: user.id,
    media_id: data.mediaId,
    media_type: data.mediaType,
    title: data.title,
    poster_url: data.posterUrl,
    watched_at: data.watchedAt,
    is_rewatch: data.isRewatch,
    rating: data.rating,
    review_text: data.reviewText
  });

  if (error) {
    console.error("Failed to log screening:", error);
    throw new Error(error.message);
  }

  revalidatePath('/profile');
  revalidatePath(`/media/${data.mediaType}/${data.mediaId}`);
  return { success: true };
}

export async function getJournalEntriesAction(mediaId: string, mediaType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase.from('cine_journal') as any)
    .select('*')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .eq('media_type', mediaType)
    .order('watched_at', { ascending: false });

  if (error) return [];
  return data;
}
