-- Add unique constraint to media_entries to prevent duplicate saves and enable clean upserts
ALTER TABLE public.media_entries ADD CONSTRAINT unique_user_media UNIQUE (user_id, external_id);

-- Add unique constraint to collection_items if not already present
-- (Assuming collection_id and media_entry_id should be unique together)
-- ALTER TABLE public.collection_items ADD CONSTRAINT unique_collection_media UNIQUE (collection_id, media_entry_id);
