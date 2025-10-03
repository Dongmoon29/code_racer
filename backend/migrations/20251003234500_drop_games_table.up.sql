-- 20251003234500_drop_games_table.up.sql
-- Drop legacy games table (replaced by matches)

-- Drop trigger first (if exists), then drop table idempotently
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
DROP TABLE IF EXISTS games;


