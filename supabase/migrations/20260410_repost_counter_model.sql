-- Repost Counter Model (TikTok-style)
-- 1) Reposts are relations on original activities, not feed rows.
-- 2) feed_activity returns original rows only (no re_archive/echo rows).

CREATE TABLE IF NOT EXISTS public.activity_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('entry', 'dispatch', 'screening')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS activity_reposts_activity_idx
  ON public.activity_reposts (activity_id, activity_type);
CREATE INDEX IF NOT EXISTS activity_reposts_user_idx
  ON public.activity_reposts (user_id);

ALTER TABLE public.activity_reposts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public activity reposts read" ON public.activity_reposts
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own activity reposts insert" ON public.activity_reposts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own activity reposts delete" ON public.activity_reposts
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reposts;
EXCEPTION WHEN others THEN NULL; END $$;

-- Backfill repost relationships from historical re_archives.
INSERT INTO public.activity_reposts (user_id, activity_id, activity_type, created_at)
SELECT DISTINCT
  r.user_id,
  r.original_entry_id AS activity_id,
  'entry' AS activity_type,
  r.created_at
FROM public.re_archives r
WHERE r.original_entry_id IS NOT NULL
ON CONFLICT (user_id, activity_id) DO NOTHING;

INSERT INTO public.activity_reposts (user_id, activity_id, activity_type, created_at)
SELECT DISTINCT
  r.user_id,
  r.original_dispatch_id AS activity_id,
  'dispatch' AS activity_type,
  r.created_at
FROM public.re_archives r
WHERE r.original_dispatch_id IS NOT NULL
ON CONFLICT (user_id, activity_id) DO NOTHING;

-- Rebuild feed view to only include original activities.
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
    'entry'::TEXT AS activity_type,
    NULL::UUID AS original_entry_id,
    NULL::TEXT AS content,
    '[]'::JSONB AS media_refs,
    NULL::UUID AS reposter_id,
    NULL::TEXT AS reposter_username,
    NULL::TEXT AS reposter_avatar_url,
    NULL::TEXT AS original_dispatch_id
  FROM public.media_entries e
  JOIN public.profiles p ON p.id = e.user_id
  LEFT JOIN public.mood_tags mt ON mt.id = e.mood_tag_id

  UNION ALL

  -- Dispatches
  SELECT
    d.id,
    d.user_id,
    p.username,
    p.avatar_url,
    NULL::TEXT AS title,
    NULL::TEXT AS poster_url,
    NULL::TEXT AS media_type,
    NULL::TEXT AS media_id,
    NULL::INT AS mood_tag_id,
    d.classification AS vibe,
    d.created_at,
    'dispatch'::TEXT AS activity_type,
    NULL::UUID AS original_entry_id,
    d.content,
    d.media_refs,
    NULL::UUID AS reposter_id,
    NULL::TEXT AS reposter_username,
    NULL::TEXT AS reposter_avatar_url,
    NULL::TEXT AS original_dispatch_id
  FROM public.dispatches d
  JOIN public.profiles p ON p.id = d.user_id

  UNION ALL

  -- Screenings
  SELECT
    j.id,
    j.user_id,
    p.username,
    p.avatar_url,
    j.title,
    j.poster_url,
    j.media_type,
    j.media_id,
    NULL::INT AS mood_tag_id,
    NULL::TEXT AS vibe,
    j.created_at,
    'screening'::TEXT AS activity_type,
    NULL::UUID AS original_entry_id,
    NULL::TEXT AS content,
    '[]'::JSONB AS media_refs,
    NULL::UUID AS reposter_id,
    NULL::TEXT AS reposter_username,
    NULL::TEXT AS reposter_avatar_url,
    NULL::TEXT AS original_dispatch_id
  FROM public.cine_journal j
  JOIN public.profiles p ON p.id = j.user_id;

