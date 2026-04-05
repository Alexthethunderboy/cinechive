-- =============================================================
-- CineChive: Phase 1 — Social Graph
-- Creates the follows table (directional: follower → following)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.follows (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- Indexes for fast lookups in both directions
CREATE INDEX IF NOT EXISTS follows_follower_idx  ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows (following_id);

-- RLS: Public social graph — anyone can see follows, only owner can mutate
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public follows read"
    ON public.follows FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own follows insert"
    ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own follows delete"
    ON public.follows FOR DELETE USING (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime so clients can subscribe to follow events
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
EXCEPTION WHEN others THEN NULL; END $$;
