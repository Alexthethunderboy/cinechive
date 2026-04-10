-- Avatar System: Storage bucket + RLS policies + avatar_seed column
-- 1. Ensure the avatars bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS Policies
-- Allow public access to read avatars
DO $$ BEGIN
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow authenticated users to upload to their own folder
DO $$ BEGIN
  CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow users to update their own files
DO $$ BEGIN
  CREATE POLICY "User Update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow users to delete their own files
DO $$ BEGIN
  CREATE POLICY "User Delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Profiles Schema Update
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_seed TEXT;
