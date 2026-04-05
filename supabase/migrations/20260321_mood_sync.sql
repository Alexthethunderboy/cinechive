-- Update existing mood_tags to match the new cinematic classification names
-- This ensures the "Vibe-Meter" is consistent with the UI Design Tokens

-- Clear existing tags to prevent conflicts if labels change drastically
TRUNCATE public.mood_tags RESTART IDENTITY CASCADE;

-- Insert new cinematic tags
INSERT INTO public.mood_tags (label, emoji, color) VALUES
  ('Essential', '⚪', '#FFFFFF'),
  ('Avant-Garde', '🟣', '#D4D4D8'),
  ('Melancholic', '🔵', '#A1A1AA'),
  ('Atmospheric', '🟢', '#71717A'),
  ('Legacy', '📜', '#E4E4E7'),
  ('Provocative', '🔴', '#F4F4F5'),
  ('Visceral', '🔥', '#FAFAFA'),
  ('Noir', '🌑', '#3F3F46');
