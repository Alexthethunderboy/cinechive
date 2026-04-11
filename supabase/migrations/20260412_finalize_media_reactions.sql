-- Finalize Media Reactions Table for Deployment
-- Adds 'anime' to the media_type check constraint and ensures indices exist.

DO $$ 
BEGIN
    -- Update the check constraint to include anime
    ALTER TABLE public.media_reactions 
    DROP CONSTRAINT IF EXISTS media_reactions_media_type_check;

    ALTER TABLE public.media_reactions 
    ADD CONSTRAINT media_reactions_media_type_check 
    CHECK (media_type IN ('movie', 'tv', 'documentary', 'anime', 'animation'));

    -- Ensure performance indices
    CREATE INDEX IF NOT EXISTS idx_media_reactions_user_id ON public.media_reactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_reactions_media ON public.media_reactions(media_id, media_type);
    
END $$;
