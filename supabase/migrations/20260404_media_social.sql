-- =============================================================
-- CineChive: Phase 3 — Media Social Proof (Ratings & Reviews)
-- =============================================================

-- Media Ratings table (Integer 1-10 scale)
CREATE TABLE IF NOT EXISTS public.media_ratings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id      TEXT        NOT NULL,
  media_type    TEXT        NOT NULL CHECK (media_type IN ('movie', 'tv')),
  rating        INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, media_id, media_type)
);

-- Media Reviews table (Detailed written critiques)
CREATE TABLE IF NOT EXISTS public.media_reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id      TEXT        NOT NULL,
  media_type    TEXT        NOT NULL,
  content       TEXT        NOT NULL CHECK (char_length(content) > 0),
  is_spoiler    BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, media_id, media_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS media_ratings_lookup_idx ON public.media_ratings (media_id, media_type);
CREATE INDEX IF NOT EXISTS media_reviews_lookup_idx ON public.media_reviews (media_id, media_type);

-- RLS
ALTER TABLE public.media_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public ratings read" ON public.media_ratings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own rating insert/update" ON public.media_ratings FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public reviews read" ON public.media_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own review insert/update" ON public.media_reviews FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_ratings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_reviews;
EXCEPTION WHEN others THEN NULL; END $$;
