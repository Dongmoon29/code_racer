-- 000001_initial_schema.down.sql
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP TRIGGER IF EXISTS update_io_schemas_updated_at ON io_schemas;
DROP TRIGGER IF EXISTS update_io_templates_updated_at ON io_templates;
DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
DROP TRIGGER IF EXISTS update_examples_updated_at ON examples;
DROP TRIGGER IF EXISTS update_problems_updated_at ON problems;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS io_schemas;
DROP TABLE IF EXISTS io_templates;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS examples;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS update_updated_at_column();

