-- Contract hardening: notifications, reactions, dispatch updates, and collection sharing

-- 1) Notifications: allow authenticated actors to insert notifications.
DO $$ BEGIN
  CREATE POLICY "Users can create notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = actor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Reactions: keep DB constraint aligned with app-supported activity types.
ALTER TABLE public.reactions
  DROP CONSTRAINT IF EXISTS reactions_activity_type_check;

ALTER TABLE public.reactions
  ADD CONSTRAINT reactions_activity_type_check
  CHECK (activity_type IN ('entry', 're_archive', 'echo', 'dispatch', 'screening'));

-- 3) Dispatches: support update timestamp used by server action.
ALTER TABLE public.dispatches
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4) Tighten collection reads and expose secure token-based read through RPC.
DROP POLICY IF EXISTS "Read by share token" ON public.collections;
DROP POLICY IF EXISTS "Public read if public" ON public.collections;
DROP POLICY IF EXISTS "Own collections crud" ON public.collections;

DO $$ BEGIN
  CREATE POLICY "Public read if public" ON public.collections
    FOR SELECT USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner read collections" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner insert collections" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner update collections" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owner delete collections" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_shared_collection(p_share_token UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'user_id', c.user_id,
    'title', c.title,
    'description', c.description,
    'is_public', c.is_public,
    'share_token', c.share_token,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'profiles', jsonb_build_object(
      'username', p.username,
      'avatar_url', p.avatar_url
    ),
    'collection_items',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', ci.id,
              'collection_id', ci.collection_id,
              'media_id', ci.media_id,
              'media_type', ci.media_type,
              'title', ci.title,
              'poster_url', ci.poster_url,
              'year', ci.year,
              'added_at', ci.added_at
            )
            ORDER BY ci.added_at DESC
          )
          FROM public.collection_items ci
          WHERE ci.collection_id = c.id
        ),
        '[]'::jsonb
      )
  )
  FROM public.collections c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.share_token = p_share_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_collection(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_collection(UUID) TO anon, authenticated, service_role;
