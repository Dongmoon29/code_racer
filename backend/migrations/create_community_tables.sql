-- Create community tables (posts, post_comments, post_votes, post_comment_votes)
-- This script creates all community-related tables with the latest schema including thread fields

-- ============================================================================
-- POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================================================
-- POST_COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID,
  thread_id UUID NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  path TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE,
  CONSTRAINT post_comments_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES post_comments(id) ON DELETE CASCADE
);

-- Indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_thread_id ON post_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_depth ON post_comments(depth);
CREATE INDEX IF NOT EXISTS idx_post_comments_path ON post_comments(path);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- ============================================================================
-- POST_VOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT post_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT post_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT post_votes_post_user_unique UNIQUE (post_id, user_id)
);

-- Indexes for post_votes
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);

-- ============================================================================
-- POST_COMMENT_VOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT post_comment_votes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
  CONSTRAINT post_comment_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT post_comment_votes_comment_user_unique UNIQUE (comment_id, user_id)
);

-- Indexes for post_comment_votes
CREATE INDEX IF NOT EXISTS idx_post_comment_votes_comment_id ON post_comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comment_votes_user_id ON post_comment_votes(user_id);

