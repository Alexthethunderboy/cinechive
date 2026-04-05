-- Post Management: Enable users to edit their own dispatches
-- Author: Antigravity
-- Date: 2026-04-05

-- 1. Add Update Policy for Dispatches
-- This policy allows users to update their own posts. 
-- We handle the "15-minute window" in the server action logic for granular error reporting.
DO $$ BEGIN
  CREATE POLICY "Own dispatches update" ON public.dispatches 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
