-- ============================================
-- Media Metadata Cache Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.media_metadata_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imdb_id TEXT UNIQUE,
  tmdb_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  trivia JSONB DEFAULT '[]'::jsonb,
  tech_specs JSONB DEFAULT '{}'::jsonb,
  script_url TEXT,
  script_preview TEXT, -- First page snippet
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_metadata_tmdb_id ON public.media_metadata_cache(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_metadata_imdb_id ON public.media_metadata_cache(imdb_id);

-- Enable RLS
ALTER TABLE public.media_metadata_cache ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read metadata" ON public.media_metadata_cache FOR SELECT USING (true);

-- System-level write access (usually handled by service role/server actions)
-- For now, allow server-side logic to handle inserts via authenticated sessions if needed, 
-- or use service role which bypasses RLS.
