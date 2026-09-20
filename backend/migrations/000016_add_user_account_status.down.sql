DROP INDEX IF EXISTS idx_users_account_status;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_account_status_check,
    DROP COLUMN IF EXISTS deactivated_at,
    DROP COLUMN IF EXISTS account_status;
