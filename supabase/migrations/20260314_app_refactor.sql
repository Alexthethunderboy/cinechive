-- Migration for App Refactor
-- 1. Add pinned_media to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pinned_media JSONB DEFAULT '[]'::jsonb;

-- 2. Create echoes table
CREATE TABLE IF NOT EXISTS public.echoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  media_title TEXT NOT NULL,
  poster_url TEXT,
  trivia_id TEXT NOT NULL,
  trivia_text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update feed_activity view
CREATE OR REPLACE VIEW public.feed_activity AS
  SELECT
    e.id, 
    e.user_id, 
    p.username,
    p.avatar_url,
    e.title, 
    e.poster_url, 
    e.media_type,
    e.external_id AS media_id,
    e.mood_tag_id, 
    mt.label AS vibe,
    e.created_at, 
    'entry' AS activity_type,
    NULL::UUID AS original_entry_id,
    NULL AS content
  FROM public.media_entries e
  JOIN public.profiles p ON p.id = e.user_id
  LEFT JOIN public.mood_tags mt ON mt.id = e.mood_tag_id
  UNION ALL
  SELECT
    r.id, 
    r.user_id, 
    p.username,
    p.avatar_url,
    me.title, 
    me.poster_url, 
    me.media_type,
    me.external_id AS media_id,
    r.mood_tag_id, 
    mt.label AS vibe,
    r.created_at, 
    're_archive' AS activity_type,
    r.original_entry_id,
    NULL AS content
  FROM public.re_archives r
  JOIN public.profiles p ON p.id = r.user_id
  JOIN public.media_entries me ON me.id = r.original_entry_id
  LEFT JOIN public.mood_tags mt ON mt.id = r.mood_tag_id
  UNION ALL
  SELECT
    ec.id,
    ec.user_id,
    p.username,
    p.avatar_url,
    ec.media_title AS title,
    ec.poster_url,
    ec.media_type,
    ec.media_id,
    NULL AS mood_tag_id,
    NULL AS vibe,
    ec.created_at,
    'echo' AS activity_type,
    NULL AS original_entry_id,
    ec.trivia_text AS content
  FROM public.echoes ec
  JOIN public.profiles p ON p.id = ec.user_id;

-- 4. RLS for Echoes
ALTER TABLE public.echoes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public echoes" ON public.echoes FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Own echoes insert" ON public.echoes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Own echoes delete" ON public.echoes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Enable Realtime for Echoes
ALTER PUBLICATION supabase_realtime ADD TABLE public.echoes;
