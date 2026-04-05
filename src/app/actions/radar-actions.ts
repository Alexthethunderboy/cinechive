'use client';

import { createClient } from '@/lib/supabase/client';

export async function toggleReminder(mediaId: string, mediaType: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return { error: 'Authentication required' };

  // Check if reminder exists
  const { data: existing } = await (supabase
    .from('user_reminders') as any)
    .select('id')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .eq('media_type', mediaType)
    .single();

  if (existing) {
    const { error } = await (supabase
      .from('user_reminders') as any)
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return { status: 'removed' };
  } else {
    const { error } = await (supabase
      .from('user_reminders') as any)
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

  const { data } = await (supabase
    .from('user_reminders') as any)
    .select('id')
    .eq('user_id', user.id)
    .eq('media_id', mediaId)
    .eq('media_type', mediaType)
    .single();

  return !!data;
}
