-- =============================================================
-- CineChive: Phase 5 — Social Notifications
-- =============================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- recipient
  actor_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- person who triggered it
  type          TEXT        NOT NULL CHECK (type IN ('follow', 'reaction', 'comment', 'mention')),
  target_id     UUID        , -- activity_id or similar
  target_type   TEXT        , -- 'activity', 'media', etc.
  metadata      JSONB       DEFAULT '{}'::jsonb,
  is_read       BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications (user_id) WHERE is_read = false;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN others THEN NULL; END $$;
