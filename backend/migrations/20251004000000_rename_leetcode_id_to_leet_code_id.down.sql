-- 20251004000000_rename_leetcode_id_to_leet_code_id.down.sql
-- Revert column rename

ALTER TABLE matches RENAME COLUMN leet_code_id TO leetcode_id;


