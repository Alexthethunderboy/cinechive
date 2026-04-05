-- Community Dispatch: Active social posting and multi-media support
-- 1. Create dispatches table for standalone posts
CREATE TABLE IF NOT EXISTS public.dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  classification TEXT, -- The 'vibe' of the post
  media_refs JSONB DEFAULT '[]'::jsonb, -- Array of {id, type, title, posterUrl}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update the feed_activity view to include Dispatches and Journal Screenings
-- We drop and recreate it because we are adding new activity types
DROP VIEW IF EXISTS public.feed_activity;

CREATE OR REPLACE VIEW public.feed_activity AS
  -- Original Vault Entries
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
    NULL AS content,
    '[]'::JSONB AS media_refs
  FROM public.media_entries e
  JOIN public.profiles p ON p.id = e.user_id
  LEFT JOIN public.mood_tags mt ON mt.id = e.mood_tag_id

  UNION ALL

  -- Re-archives (Collections)
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
    NULL AS content,
    '[]'::JSONB AS media_refs
  FROM public.re_archives r
  JOIN public.profiles p ON p.id = r.user_id
  JOIN public.media_entries me ON me.id = r.original_entry_id
  LEFT JOIN public.mood_tags mt ON mt.id = r.mood_tag_id

  UNION ALL

  -- Echoes (Trivia/Notes)
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
    ec.trivia_text AS content,
    '[]'::JSONB AS media_refs
  FROM public.echoes ec
  JOIN public.profiles p ON p.id = ec.user_id

  UNION ALL

  -- Dispatches (Status Posts)
  SELECT
    d.id,
    d.user_id,
    p.username,
    p.avatar_url,
    NULL AS title,
    NULL AS poster_url,
    NULL AS media_type,
    NULL AS media_id,
    NULL AS mood_tag_id,
    d.classification AS vibe,
    d.created_at,
    'dispatch' AS activity_type,
    NULL AS original_entry_id,
    d.content,
    d.media_refs
  FROM public.dispatches d
  JOIN public.profiles p ON p.id = d.user_id

  UNION ALL

  -- Screenings (Journal Logs)
  SELECT
    j.id,
    j.user_id,
    p.username,
    p.avatar_url,
    j.title,
    j.poster_url,
    j.media_type,
    j.media_id,
    NULL AS mood_tag_id,
    NULL AS vibe,
    j.created_at,
    'screening' AS activity_type,
    NULL AS original_entry_id,
    NULL AS content,
    '[]'::JSONB AS media_refs
  FROM public.cine_journal j
  JOIN public.profiles p ON p.id = j.user_id;

-- 3. RLS for Dispatches
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public dispatches" ON public.dispatches FOR SELECT USING (true);
CREATE POLICY "Own dispatches insert" ON public.dispatches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own dispatches delete" ON public.dispatches FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatches;
