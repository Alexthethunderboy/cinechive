-- Update category CHECK constraint to include 'genre'
-- This fixes the error where onboarding tastes couldn't be saved because 'genre' was not a valid category.

DO $$ 
BEGIN
    -- Drop the old constraint if it exists
    ALTER TABLE public.user_onboarding_tastes 
    DROP CONSTRAINT IF EXISTS user_onboarding_tastes_category_check;

    -- Add the new constraint with 'genre' included
    ALTER TABLE public.user_onboarding_tastes 
    ADD CONSTRAINT user_onboarding_tastes_category_check 
    CHECK (category IN ('movie', 'style', 'creator', 'genre'));
END $$;
