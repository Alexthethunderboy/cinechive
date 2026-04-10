-- Avatar character mode: persistent animated character presets
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_mode TEXT DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS avatar_character TEXT,
  ADD COLUMN IF NOT EXISTS avatar_animation TEXT;

UPDATE public.profiles
SET
  avatar_mode = COALESCE(avatar_mode, 'image'),
  avatar_character = COALESCE(avatar_character, 'cyber-noir'),
  avatar_animation = COALESCE(avatar_animation, 'float');

ALTER TABLE public.profiles
  ALTER COLUMN avatar_mode SET DEFAULT 'image',
  ALTER COLUMN avatar_mode SET NOT NULL,
  ALTER COLUMN avatar_character SET DEFAULT 'cyber-noir',
  ALTER COLUMN avatar_character SET NOT NULL,
  ALTER COLUMN avatar_animation SET DEFAULT 'float',
  ALTER COLUMN avatar_animation SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_avatar_mode_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_mode_check
      CHECK (avatar_mode IN ('image', 'character'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_avatar_character_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_character_check
      CHECK (avatar_character IN ('cyber-noir', 'retro-anime', 'space-drifter', 'mystic-director'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_avatar_animation_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_animation_check
      CHECK (avatar_animation IN ('float', 'pulse', 'orbit'));
  END IF;
END $$;
