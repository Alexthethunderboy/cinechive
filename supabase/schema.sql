-- ============================================
-- Enterchive v1 Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  trakt_token TEXT,
  lastfm_username TEXT,
  pinned_media JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Follows (social graph)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. Mood Tags (the "Vibe-Meter" vocabulary)
CREATE TABLE IF NOT EXISTS public.mood_tags (
  id SERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL,
  emoji TEXT,
  color TEXT
);

-- Seed default moods
INSERT INTO public.mood_tags (label, emoji, color) VALUES
  ('Mind-Expanding', '🧠', '#8B5CF6'),
  ('Hype', '🔥', '#F97316'),
  ('Melancholic', '🌧️', '#6366F1'),
  ('Chill', '🍃', '#22C55E'),
  ('Nostalgic', '📼', '#EAB308'),
  ('Chaotic', '🌀', '#EF4444'),
  ('Euphoric', '✨', '#EC4899'),
  ('Dark', '🖤', '#1E293B')
ON CONFLICT (label) DO NOTHING;

-- 4. Media Entries (the core archive)
CREATE TABLE IF NOT EXISTS public.media_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie','tv','documentary','music')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  year INT,
  mood_tag_id INT REFERENCES public.mood_tags(id),
  notes TEXT,
  is_vault BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Re-Archives (Social "Pulse" remix)
CREATE TABLE IF NOT EXISTS public.re_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_entry_id UUID NOT NULL REFERENCES public.media_entries(id) ON DELETE CASCADE,
  mood_tag_id INT REFERENCES public.mood_tags(id),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Echoes (shared trivia/BTS)
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

-- 7. Feed activity view
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
    NULL AS content -- For echoes
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

-- RLS for Echoes
ALTER TABLE public.echoes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public echoes" ON public.echoes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own echoes insert" ON public.echoes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own echoes delete" ON public.echoes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime for Echoes
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.echoes;
EXCEPTION WHEN others THEN NULL; END $$;

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_archives ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public follows" ON public.follows FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own follows insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own follows delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public entries" ON public.media_entries FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own entries insert" ON public.media_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own entries update" ON public.media_entries FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own entries delete" ON public.media_entries FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public re_archives" ON public.re_archives FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own re_archives insert" ON public.re_archives FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own re_archives delete" ON public.re_archives FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_entries;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.re_archives;
EXCEPTION WHEN others THEN NULL; END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
