-- =============================================================
-- CineChive: Phase 6 — Next-Gen Social Features
-- =============================================================

-- 1. Extend Profiles for Spotlight & Style
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotlight_media_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotlight_media_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spotlight_caption TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#FFFFFF';

-- 2. Cine-Lists (Curated shared lists)
CREATE TABLE IF NOT EXISTS public.cine_lists (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  is_public     BOOLEAN     DEFAULT true,
  cover_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cine_list_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       UUID        NOT NULL REFERENCES public.cine_lists(id) ON DELETE CASCADE,
  media_id      TEXT        NOT NULL,
  media_type    TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  poster_url    TEXT,
  note          TEXT,
  added_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (list_id, media_id, media_type)
);

-- 3. Cine-Journal (Viewing Log / Diary)
CREATE TABLE IF NOT EXISTS public.cine_journal (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id      TEXT        NOT NULL,
  media_type    TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  poster_url    TEXT,
  watched_at    TIMESTAMPTZ DEFAULT now(),
  is_rewatch    BOOLEAN     DEFAULT false,
  rating        INTEGER     CHECK (rating BETWEEN 1 AND 10),
  review_text   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS & Realtime
ALTER TABLE public.cine_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cine_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cine_journal ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public lists selectable" ON public.cine_lists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
  CREATE POLICY "Own lists CRUD" ON public.cine_lists FOR ALL USING (auth.uid() = user_id);
  
  CREATE POLICY "Public items selectable" ON public.cine_list_items FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.cine_lists WHERE id = list_id AND (is_public = true OR auth.uid() = user_id)
  ));
  CREATE POLICY "Own items CRUD" ON public.cine_list_items FOR ALL USING (EXISTS (
    SELECT 1 FROM public.cine_lists WHERE id = list_id AND auth.uid() = user_id
  ));

  CREATE POLICY "Public journal selectable" ON public.cine_journal FOR SELECT USING (true);
  CREATE POLICY "Own journal CRUD" ON public.cine_journal FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cine_lists;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cine_journal;
EXCEPTION WHEN others THEN NULL; END $$;
