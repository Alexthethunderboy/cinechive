-- ============================================
-- Add Performance Indexes
-- Description: Adds composite and frequent-lookup B-Tree indexes 
-- to optimize queries on feed_activity and media entries.
-- ============================================

-- 1. Index on media_entries
-- Optimize lookup by user_id
CREATE INDEX IF NOT EXISTS idx_media_entries_user_id ON public.media_entries(user_id);
-- Optimize lookup by external_id (for Vault lookups and duplicate checks)
CREATE INDEX IF NOT EXISTS idx_media_entries_external_id ON public.media_entries(external_id);
-- Optimize compound lookup for upserts
CREATE INDEX IF NOT EXISTS idx_media_entries_user_external ON public.media_entries(user_id, external_id);

-- 2. Index on re_archives
-- Optimize finding original entries shared by users
CREATE INDEX IF NOT EXISTS idx_re_archives_user_id ON public.re_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_re_archives_original_entry_id ON public.re_archives(original_entry_id);

-- 3. Index on follows
-- Optimize fetching the "following" list for feed building
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
-- Optimize fetching "followers" list
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- 4. Index on comments and reactions
-- Optimize fetching comments/reactions for specific activities
CREATE INDEX IF NOT EXISTS idx_comments_activity_id ON public.comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_reactions_activity_id ON public.reactions(activity_id);
