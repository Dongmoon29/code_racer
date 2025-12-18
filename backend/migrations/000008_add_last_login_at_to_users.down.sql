-- 000008_add_last_login_at_to_users.down.sql
DROP INDEX IF EXISTS idx_users_last_login_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
