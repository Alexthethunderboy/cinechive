'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Create a new community 'Dispatch' (status post).
 * Supports optional multi-media references and vibe classification.
 */
export async function createDispatchAction(formData: {
  content: string;
  classification?: string;
  mediaRefs?: any[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  const { error } = await (supabase.from('dispatches') as any).insert({
    user_id: user.id,
    content: formData.content,
    classification: formData.classification || null,
    media_refs: formData.mediaRefs || [],
  });

  if (error) {
    console.error('createDispatchAction error:', error);
    return { error: error.message };
  }

  // Broad revalidation to update all relevant feeds
  revalidatePath('/community');
  revalidatePath('/profile', 'layout');
  revalidatePath('/', 'layout');

  return { success: true };
}

/**
 * Delete a dispatch post.
 */
export async function deleteDispatchAction(dispatchId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  const { error } = await (supabase
    .from('dispatches') as any)
    .delete()
    .eq('id', dispatchId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/community');
  revalidatePath('/profile', 'layout');
  return { success: true };
}
/**
 * Update an existing community 'Dispatch'.
 * Includes a 15-minute window check for authenticity.
 */
export async function updateDispatchAction(dispatchId: string, formData: {
  content: string;
  classification?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required.' };

  // 1. Fetch the original dispatch to check timestamps
  const { data: original, error: fetchError } = await (supabase
    .from('dispatches') as any)
    .select('created_at, user_id')
    .eq('id', dispatchId)
    .single();

  if (fetchError || !original) return { error: 'Post not found.' };
  if (original.user_id !== user.id) return { error: 'Unauthorized to edit this post.' };

  // 2. Enforce the 15-minute window (user request)
  const createdAt = new Date(original.created_at).getTime();
  const now = Date.now();
  const diffInMinutes = (now - createdAt) / (1000 * 60);

  if (diffInMinutes > 15) {
    return { error: 'The editing window (15 minutes) has closed. This post is now permanent.' };
  }

  // 3. Perform the update
  const { error: updateError } = await (supabase
    .from('dispatches') as any)
    .update({
      content: formData.content,
      classification: formData.classification || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', dispatchId)
    .eq('user_id', user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/community');
  revalidatePath('/profile', 'layout');
  return { success: true };
}
