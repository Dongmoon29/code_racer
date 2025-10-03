-- 20251003233000_create_matches_table.down.sql
-- Drop matches table and its trigger

-- Drop trigger first (if exists), then drop table
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP TABLE IF EXISTS matches;


