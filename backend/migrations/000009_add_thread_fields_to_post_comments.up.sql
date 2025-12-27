-- 000009_add_thread_fields_to_post_comments.up.sql
-- Add thread_id, depth, and path columns to post_comments table for improved query performance

-- Add new columns
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS thread_id UUID,
ADD COLUMN IF NOT EXISTS depth INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS path TEXT;

-- Add foreign key constraint for thread_id (self-referencing)
ALTER TABLE post_comments
ADD CONSTRAINT post_comments_thread_id_fkey 
FOREIGN KEY (thread_id) REFERENCES post_comments(id) ON DELETE CASCADE;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_comments_thread_id ON post_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_depth ON post_comments(depth);
CREATE INDEX IF NOT EXISTS idx_post_comments_path ON post_comments(path);

-- Migrate existing data
-- Step 1: Set thread_id for top-level comments (parent_id IS NULL)
UPDATE post_comments
SET thread_id = id, depth = 0, path = id::TEXT
WHERE parent_id IS NULL;

-- Step 2: Recursively update nested comments
-- This uses a recursive CTE to build the path and calculate depth
WITH RECURSIVE comment_tree AS (
  -- Base case: top-level comments
  SELECT 
    id,
    parent_id,
    id as thread_id,
    0 as depth,
    id::TEXT as path
  FROM post_comments
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: nested comments
  SELECT 
    c.id,
    c.parent_id,
    ct.thread_id,
    ct.depth + 1,
    ct.path || '/' || c.id::TEXT
  FROM post_comments c
  INNER JOIN comment_tree ct ON c.parent_id = ct.id
)
UPDATE post_comments pc
SET 
  thread_id = ct.thread_id,
  depth = ct.depth,
  path = ct.path
FROM comment_tree ct
WHERE pc.id = ct.id AND pc.thread_id IS NULL;

-- Set NOT NULL constraint on thread_id after migration
ALTER TABLE post_comments
ALTER COLUMN thread_id SET NOT NULL;

