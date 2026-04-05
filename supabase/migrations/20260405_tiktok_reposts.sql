-- Next-Gen TikTok Repost Social System
-- Author: Antigravity
-- Date: 2026-04-05

-- 1. Upgrade re_archives to support dispatches alongside external media entries
ALTER TABLE public.re_archives 
  ALTER COLUMN original_entry_id DROP NOT NULL,
  ADD COLUMN original_dispatch_id UUID REFERENCES public.dispatches(id) ON DELETE CASCADE;

-- Add check to ensure a re_archive points to ONE specific original post type
ALTER TABLE public.re_archives 
  ADD CONSTRAINT re_archives_target_check 
  CHECK (
    (original_entry_id IS NOT NULL AND original_dispatch_id IS NULL) OR 
    (original_entry_id IS NULL AND original_dispatch_id IS NOT NULL)
  );

-- 2. Drop and Replace feed_activity to make Dispatches the EXCLUSIVE way to organically post
DROP VIEW IF EXISTS public.feed_activity;

CREATE OR REPLACE VIEW public.feed_activity AS
  -- A) Original Dispatches (from Composer)
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
    'dispatch' AS activity_type,
    NULL::UUID AS original_entry_id,
    d.content,
    d.media_refs,
    -- Reposter fields: NULL for organic posts
    NULL::UUID AS reposter_id,
    NULL::TEXT AS reposter_username,
    NULL::TEXT AS reposter_avatar_url,
    NULL::TEXT AS original_dispatch_id
  FROM public.dispatches d
  JOIN public.profiles p ON p.id = d.user_id

  UNION ALL

  -- B) Re-archives (TikTok-style Collections / Reposts)
  -- Case B1: Reposting an Entry (Film Save)
  SELECT
    r.id, 
    me.user_id, -- Original Author User ID
    op.username, -- Original Author Username
    op.avatar_url, -- Original Author Avatar
    me.title, 
    me.poster_url, 
    me.media_type,
    me.external_id AS media_id,
    r.mood_tag_id, 
    mt.label AS vibe,
    r.created_at, 
    're_archive' AS activity_type,
    r.original_entry_id,
    NULL::TEXT AS content,
    '[]'::JSONB AS media_refs,
    -- Reposter Info
    r.user_id AS reposter_id,
    rp.username AS reposter_username,
    rp.avatar_url AS reposter_avatar_url,
    NULL::TEXT AS original_dispatch_id
  FROM public.re_archives r
  JOIN public.media_entries me ON me.id = r.original_entry_id
  JOIN public.profiles op ON op.id = me.user_id -- Original Poster
  JOIN public.profiles rp ON rp.id = r.user_id   -- Reposter
  LEFT JOIN public.mood_tags mt ON mt.id = r.mood_tag_id
  WHERE r.original_entry_id IS NOT NULL

  UNION ALL

  -- Case B2: Reposting a Dispatch (Composer Post)
  SELECT
    r.id, 
    d.user_id, -- Original Author User ID
    op.username, -- Original Author Username
    op.avatar_url, -- Original Author Avatar
    NULL::TEXT AS title, 
    NULL::TEXT AS poster_url, 
    NULL::TEXT AS media_type,
    NULL::TEXT AS media_id,
    r.mood_tag_id, 
    d.classification AS vibe, 
    r.created_at, 
    're_archive' AS activity_type,
    r.original_entry_id AS original_entry_id,
    d.content,
    d.media_refs,
    -- Reposter Info
    r.user_id AS reposter_id,
    rp.username AS reposter_username,
    rp.avatar_url AS reposter_avatar_url,
    r.original_dispatch_id::TEXT AS original_dispatch_id
  FROM public.re_archives r
  JOIN public.dispatches d ON d.id = r.original_dispatch_id
  JOIN public.profiles op ON op.id = d.user_id    -- Original Poster
  JOIN public.profiles rp ON rp.id = r.user_id     -- Reposter
  WHERE r.original_dispatch_id IS NOT NULL;
