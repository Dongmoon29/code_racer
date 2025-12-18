-- 000005_add_parent_id_to_post_comments.up.sql
-- Add parent_id column to post_comments table for nested comments (replies)
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS parent_id UUID;

-- Add foreign key constraint for parent_id
ALTER TABLE post_comments
ADD CONSTRAINT post_comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);

