-- add_user_rating.down.sql
BEGIN;
ALTER TABLE users DROP COLUMN IF EXISTS rating;
COMMIT;
