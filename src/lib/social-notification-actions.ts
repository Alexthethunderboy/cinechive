'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'follow' | 'reaction' | 'comment' | 'mention';
export interface SocialNotificationRecord {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  target_id?: string | null;
  target_type?: string | null;
  metadata?: Record<string, any> | null;
  actor?: {
    username: string;
    avatar_url: string | null;
  };
}

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

  const raw = (data as SocialNotificationRecord[]) || [];

  // Reduce notification noise by grouping recent reaction/comment events from same actor.
  const grouped: SocialNotificationRecord[] = [];
  for (const notif of raw) {
    const isGroupable = notif.type === 'reaction' || notif.type === 'comment';
    if (!isGroupable) {
      grouped.push(notif);
      continue;
    }
    const existing = grouped.find((g) =>
      g.type === notif.type &&
      g.actor_id === notif.actor_id &&
      g.target_type === notif.target_type &&
      Math.abs(new Date(g.created_at).getTime() - new Date(notif.created_at).getTime()) < 30 * 60 * 1000
    );
    if (existing) {
      existing.metadata = {
        ...(existing.metadata || {}),
        grouped_count: (existing.metadata?.grouped_count || 1) + 1,
      };
      existing.is_read = existing.is_read && notif.is_read;
    } else {
      grouped.push(notif);
    }
  }

  return grouped.slice(0, 50);
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
