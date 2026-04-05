-- ============================================
-- Collections & Sharing
-- ============================================

-- 1. Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Collection Items Table
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL, -- Unified ID (e.g., tmdb-123)
  media_type TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_url TEXT,
  year INT,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, media_id)
);

-- 3. RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Collections
DO $$ BEGIN
  CREATE POLICY "Public read if public" ON public.collections 
    FOR SELECT USING (is_public = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Read by share token" ON public.collections 
    FOR SELECT USING (true); -- We will filter by share_token in the query
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own collections crud" ON public.collections 
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Policies for Collection Items
DO $$ BEGIN
  CREATE POLICY "Public read items if collection is public" ON public.collection_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.collections 
        WHERE id = collection_items.collection_id AND is_public = true
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Own collection items crud" ON public.collection_items
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.collections 
        WHERE id = collection_items.collection_id AND user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_share_token ON public.collections(share_token);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);

-- 7. Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_items;
EXCEPTION WHEN others THEN NULL; END $$;
