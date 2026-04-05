-- ============================================
-- Migration: Onboarding Tastes ("The Casting Call")
-- ============================================

-- 1. Add onboarding_completed flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 2. Create user_onboarding_tastes table
CREATE TABLE IF NOT EXISTS public.user_onboarding_tastes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- category: 'movie' | 'style' | 'creator'
  category TEXT NOT NULL CHECK (category IN ('movie', 'style', 'creator')),
  -- value: TMDB id (as text), classification name, or person name
  value TEXT NOT NULL,
  display_name TEXT,
  poster_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, category, value)
);

-- 3. RLS for user_onboarding_tastes
ALTER TABLE public.user_onboarding_tastes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Own tastes select" ON public.user_onboarding_tastes
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own tastes insert" ON public.user_onboarding_tastes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own tastes delete" ON public.user_onboarding_tastes
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own tastes update" ON public.user_onboarding_tastes
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
