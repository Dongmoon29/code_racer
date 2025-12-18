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

CREATE INDEX IF NOT EXISTS idx_post_comment_votes_comment_id ON post_comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comment_votes_user_id ON post_comment_votes(user_id);


