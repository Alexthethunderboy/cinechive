-- =============================================================
-- CineChive: Media Reactions (Likes & Dislikes)
-- =============================================================

-- Media Reactions table (Like/Dislike preferences)
CREATE TABLE IF NOT EXISTS public.media_reactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id      TEXT        NOT NULL,
  media_type    TEXT        NOT NULL CHECK (media_type IN ('movie', 'tv', 'music', 'documentary')),
  reaction      TEXT        NOT NULL CHECK (reaction IN ('like', 'dislike')),
  title         TEXT,
  poster_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, media_id, media_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS media_reactions_lookup_idx ON public.media_reactions (media_id, media_type);
CREATE INDEX IF NOT EXISTS media_reactions_user_idx ON public.media_reactions (user_id);

-- RLS
ALTER TABLE public.media_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public reactions read" ON public.media_reactions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own reaction insert/update/delete" ON public.media_reactions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_reactions;
EXCEPTION WHEN others THEN NULL; END $$;