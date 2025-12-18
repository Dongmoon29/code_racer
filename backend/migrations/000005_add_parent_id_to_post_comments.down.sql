-- 000005_add_parent_id_to_post_comments.down.sql
-- Remove parent_id column from post_comments table
DROP INDEX IF EXISTS idx_post_comments_parent_id;
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_parent_id_fkey;
ALTER TABLE post_comments DROP COLUMN IF EXISTS parent_id;

