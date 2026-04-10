'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotificationInternal } from './social-notification-actions';
import type { SocialActionResult } from './social-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthorIdForActivity(activityId: string, activityType: string): Promise<string | null> {
  const supabase = await createClient();
  let table = 'media_entries';
  if (activityType === 're_archive') table = 're_archives';
  if (activityType === 'echo') table = 'echoes';
  if (activityType === 'dispatch') table = 'dispatches';
  if (activityType === 'screening') table = 'cine_journal';

  const { data: activity } = await (supabase.from(table) as any)
    .select('user_id')
    .eq('id', activityId)
    .single();

  return activity?.user_id || null;
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReactionAction(activityId: string, activityType: 'entry' | 're_archive' | 'echo' | 'dispatch' | 'screening'): Promise<SocialActionResult & { reacted?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.', code: 'AUTH_REQUIRED' };

  // Check if exists
  const { data: existing } = await (supabase
    .from('reactions') as any)
    .select('id')
    .eq('user_id', user.id)
    .eq('activity_id', activityId)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await (supabase.from('reactions') as any).delete().eq('id', existing.id);
    if (error) return { error: error.message, code: 'UNKNOWN_ERROR' };
  } else {
    // Like
    const { error } = await (supabase.from('reactions') as any).insert({
      user_id: user.id,
      activity_id: activityId,
      activity_type: activityType
    });
    if (error && error.code !== '23505') {
      return { error: error.message, code: 'UNKNOWN_ERROR' };
    }

    // Phase 5 Social Sync: New Reaction Notification
    const authorId = await getAuthorIdForActivity(activityId, activityType);
    if (authorId) {
      await createNotificationInternal(authorId, 'reaction', user.id, activityId, 'activity');
    }
  }

  revalidatePath('/community');
  return { success: true, reacted: !existing };
}


export async function getActivityReactionCount(activityId: string) {
  const supabase = await createClient();
  const { count } = await (supabase.from('reactions') as any)
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId);
  return count ?? 0;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CommentWithUser {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export async function getCommentsAction(activityId: string): Promise<CommentWithUser[]> {
  const supabase = await createClient();
  
  const { data, error } = await (supabase
    .from('comments') as any)
    .select(`
      id, body, created_at, user_id,
      profiles:user_id (username, avatar_url)
    `)
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((c: any) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    user_id: c.user_id,
    username: c.profiles.username,
    avatar_url: c.profiles.avatar_url
  }));
}

export async function postCommentAction(activityId: string, activityType: string, body: string): Promise<SocialActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.', code: 'AUTH_REQUIRED' };

  if (!body.trim()) return { error: 'Comment cannot be empty.', code: 'VALIDATION_ERROR' };

  const { error } = await (supabase.from('comments') as any).insert({
    user_id: user.id,
    activity_id: activityId,
    activity_type: activityType,
    body: body.trim()
  });

  if (error) return { error: error.message, code: 'UNKNOWN_ERROR' };

  // Phase 5 Social Sync: New Comment Notification
  const authorId = await getAuthorIdForActivity(activityId, activityType);
  if (authorId) {
    await createNotificationInternal(authorId, 'comment', user.id, activityId, 'activity', { preview: body.substring(0, 50) });
  }

  // Mention notifications: supports @username in comments.
  const mentionMatches = Array.from(new Set((body.match(/@([a-zA-Z0-9._-]+)/g) || []).map((m) => m.slice(1).toLowerCase())));
  if (mentionMatches.length > 0) {
    const { data: mentionedProfiles } = await (supabase
      .from('profiles') as any)
      .select('id, username')
      .in('username', mentionMatches);
    for (const mentioned of mentionedProfiles || []) {
      if (mentioned.id !== user.id) {
        await createNotificationInternal(mentioned.id, 'mention', user.id, activityId, 'activity', {
          preview: body.substring(0, 80),
        });
      }
    }
  }

  revalidatePath('/community');
  return { success: true };
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  const { error } = await (supabase.from('comments') as any)
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/community');
  return { success: true };
}
