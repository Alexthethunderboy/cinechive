'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ProfileUpdateData {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  avatar_seed?: string | null;
  avatar_mode?: 'image' | 'character' | null;
  avatar_character?: string | null;
  avatar_animation?: 'float' | 'pulse' | 'orbit' | null;
  lastfm_username?: string | null;
}

/**
 * Update the user's profile information.
 */
export async function updateProfile(data: ProfileUpdateData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const { error } = await (supabase
    .from('profiles') as any)
    .update({
      display_name: data.display_name,
      bio: data.bio,
      avatar_url: data.avatar_url,
      avatar_seed: data.avatar_seed,
      avatar_mode: data.avatar_mode,
      avatar_character: data.avatar_character,
      avatar_animation: data.avatar_animation,
      lastfm_username: data.lastfm_username,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('updateProfile error:', error);
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/profile/settings');
  return { success: true };
}

/**
 * Delete the user's account and all associated data.
 * Safety: This is a permanent action.
 */
export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const { error } = await (supabase
    .from('profiles') as any)
    .delete()
    .eq('id', user.id);

  if (error) {
    console.error('deleteAccount error:', error);
    return { error: error.message };
  }

  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * Clear all media entry logs for the user.
 */
export async function clearHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Authentication required.' };
  }

  const { error } = await (supabase
    .from('media_entries') as any)
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('clearHistory error:', error);
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}
