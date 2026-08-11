'use client';

import { createClient } from '@/lib/supabase/client';

export async function toggleReminder(mediaId: string, mediaType: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return { error: 'Authentication required' };

  // Check if reminder exists
  const { data: existing } = await supabase
    .from('user_reminders')
    .select('id')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .eq('media_type', mediaType)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_reminders')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return { status: 'removed' };
  } else {
    const { error } = await supabase
      .from('user_reminders')
      .insert({
        user_id: user.id,
        media_id: mediaId,
        media_type: mediaType
      });
    if (error) throw error;
    return { status: 'added' };
  }
}

export async function getReminderStatus(mediaId: string, mediaType: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return false;

  const { data } = await supabase
    .from('user_reminders')
    .select('id')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .eq('media_type', mediaType)
    .maybeSingle();

  return !!data;
}

export async function getReminderStatuses(
  items: Array<{ mediaId: string; mediaType: string }>,
): Promise<Record<string, boolean>> {
  const normalized = Array.from(
    new Map(
      items
        .filter((item) => item.mediaId && item.mediaType)
        .slice(0, 100)
        .map((item) => [`${item.mediaType}:${item.mediaId}`, item]),
    ).values(),
  );

  if (normalized.length === 0) return {};

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return {};

    const mediaIds = Array.from(new Set(normalized.map((item) => item.mediaId)));
    const allowedKeys = new Set(normalized.map((item) => `${item.mediaType}:${item.mediaId}`));
    const { data, error } = await supabase.from('user_reminders')
      .select('media_id, media_type')
      .eq('user_id', session.user.id)
      .in('media_id', mediaIds);

    if (error || !data) return {};

    return data.reduce((statuses: Record<string, boolean>, row) => {
      const key = `${row.media_type}:${row.media_id}`;
      if (allowedKeys.has(key)) statuses[key] = true;
      return statuses;
    }, {});
  } catch {
    return {};
  }
}
