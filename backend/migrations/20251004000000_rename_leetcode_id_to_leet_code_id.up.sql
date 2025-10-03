-- 20251004000000_rename_leetcode_id_to_leet_code_id.up.sql
-- Align matches column name with GORM default (leet_code_id)

ALTER TABLE matches RENAME COLUMN leetcode_id TO leet_code_id;


