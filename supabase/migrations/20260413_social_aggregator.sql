-- =============================================================
-- CineChive: Social Aggregator RPC
-- Returns follower and following counts for a specific user.
-- This bypasses RLS using SECURITY DEFINER for reliability.
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_follow_counts(target_id UUID)
RETURNS JSON AS $$
DECLARE
    follower_count INTEGER;
    following_count INTEGER;
BEGIN
    -- Count followers (people following the target)
    SELECT count(*) INTO follower_count
    FROM public.follows
    WHERE following_id = target_id;

    -- Count following (people the target follows)
    SELECT count(*) INTO following_count
    FROM public.follows
    WHERE follower_id = target_id;

    RETURN json_build_object(
        'followers', follower_count,
        'following', following_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
