-- =============================================================
-- CineChive: Phase 2 — Social Interaction (Reactions & Comments)
-- =============================================================

-- Reactions table (Likes)
-- We store the source table ID (activity_id) and the type.
-- This keeps FKs clean or logic simple across the feed_activity view.
CREATE TABLE IF NOT EXISTS public.reactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id   UUID        NOT NULL, -- ID from media_entries, re_archives, or echoes
  activity_type TEXT        NOT NULL CHECK (activity_type IN ('entry', 're_archive', 'echo')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, activity_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id   UUID        NOT NULL,
  activity_type TEXT        NOT NULL,
  body          TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS reactions_activity_idx ON public.reactions (activity_id);
CREATE INDEX IF NOT EXISTS comments_activity_idx  ON public.comments  (activity_id);

-- RLS: Public read, own write
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public reactions read" ON public.reactions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own reaction insert" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own reaction delete" ON public.reactions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public comments read" ON public.comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own comment insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own comment update" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own comment delete" ON public.comments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN others THEN NULL; END $$;
