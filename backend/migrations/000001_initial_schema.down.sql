-- 000001_initial_schema.down.sql
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
DROP TRIGGER IF EXISTS update_leet_codes_updated_at ON leet_codes;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS leet_codes;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS update_updated_at_column();

