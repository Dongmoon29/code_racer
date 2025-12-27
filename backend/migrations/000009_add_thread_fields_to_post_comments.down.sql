-- 000009_add_thread_fields_to_post_comments.down.sql
-- Remove thread_id, depth, and path columns from post_comments table

-- Drop indexes
DROP INDEX IF EXISTS idx_post_comments_path;
DROP INDEX IF EXISTS idx_post_comments_depth;
DROP INDEX IF EXISTS idx_post_comments_thread_id;

-- Drop foreign key constraint
ALTER TABLE post_comments
DROP CONSTRAINT IF EXISTS post_comments_thread_id_fkey;

-- Drop columns
ALTER TABLE post_comments
DROP COLUMN IF EXISTS path,
DROP COLUMN IF EXISTS depth,
DROP COLUMN IF EXISTS thread_id;

