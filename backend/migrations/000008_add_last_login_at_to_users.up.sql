-- 000008_add_last_login_at_to_users.up.sql
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;

-- Add index for efficient queries on last_login_at
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Update existing users with current timestamp as a reasonable default
UPDATE users SET last_login_at = created_at WHERE last_login_at IS NULL;
