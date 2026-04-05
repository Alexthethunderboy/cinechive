'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'follow' | 'reaction' | 'comment' | 'mention';

/**
 * Fetch social notifications for the current user.
 */
export async function getSocialNotificationsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase.from('notifications') as any)
    .select(`
      *,
      actor:actor_id (username, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }

  return data as any[];
}

/**
 * Mark a notification as read.
 */
export async function markNotificationAsReadAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Auth required' };

  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Internal helper to create a notification.
 * This is used by other server actions (follow, react, comment).
 */
export async function createNotificationInternal(
  recipientId: string, 
  type: NotificationType, 
  actorId: string, 
  targetId?: string, 
  targetType?: string, 
  metadata: any = {}
) {
  // Prevent notifying yourself
  if (recipientId === actorId) return;

  const supabase = await createClient();
  
  const { error } = await (supabase.from('notifications') as any).insert({
    user_id: recipientId,
    actor_id: actorId,
    type,
    target_id: targetId,
    target_type: targetType,
    metadata,
    is_read: false
  });

  if (error) {
    console.error(`Failed to create ${type} notification:`, error.message);
  }
}
