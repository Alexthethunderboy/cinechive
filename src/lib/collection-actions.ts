'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCollectionAction(data: {
  title: string;
  description?: string;
  isPublic?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { data: col, error } = await supabase.from('collections').insert({
    user_id: user.id,
    title: data.title,
    description: data.description,
    is_public: data.isPublic || false
  }).select().single();

  if (error) throw new Error(error.message);
  revalidatePath('/vault');
  return { success: true, collectionId: col.id };
}

export async function deleteCollectionAction(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await supabase.from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error("Failed to delete collection:", error);
    throw new Error(error.message);
  }

  revalidatePath('/vault');
  return { success: true };
}

export async function addMediaToCollectionAction(collectionId: string, media: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  // First verify ownership of the collection
  const { data: collection } = await supabase.from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();

  if (!collection) throw new Error("Collection not found or access denied.");

  const { error } = await supabase.from('collection_items').upsert({
    collection_id: collectionId,
    media_id: media.id,
    media_type: media.type,
    title: media.displayTitle || media.title,
    poster_url: media.posterUrl,
    year: media.releaseYear,
  });

  if (error) {
    console.error("Failed to add to collection:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/vault/collections/${collectionId}`);
  return { success: true };
}

export async function removeMediaFromCollectionAction(collectionId: string, mediaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await supabase.from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('media_id', mediaId);

  if (error) {
    console.error("Failed to remove from collection:", error);
    throw new Error(error.message);
  }

  revalidatePath(`/vault/collections/${collectionId}`);
  return { success: true };
}

export async function getUserCollectionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from('collections')
    .select(`
      *,
      collection_items(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch user collections:", error);
    return [];
  }

  return (data || []).map((collection: any) => ({
    ...collection,
    item_count: collection.collection_items?.[0]?.count ?? 0,
  }));
}

export async function getCollectionDetailsAction(collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const query = supabase.from('collections')
    .select(`
      *,
      collection_items (*)
    `)
    .eq('id', collectionId);

  // If not owner, must be public (token logic handled separately if needed)
  const { data: collection, error } = await query.single();

  if (error || !collection) {
    console.error("Failed to fetch collection details:", error);
    return null;
  }

  // Security check: if not owner and not public, deny (unless sharing logic applies)
  if (collection.user_id !== user?.id && !collection.is_public) {
    // Check if it's being accessed via a share token (this would be in the public route)
    return null;
  }

  return collection;
}

export async function getSharedCollectionAction(shareToken: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(shareToken)) {
    return null;
  }

  const supabase = await createClient();

  const { data: payload, error } = await supabase.rpc('get_shared_collection', {
    p_share_token: shareToken
  });

  if (error || !payload) {
    console.error("Failed to fetch shared collection:", error);
    return null;
  }

  return payload;
}

