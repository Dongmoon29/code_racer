-- 000001_initial_schema.up.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          VARCHAR(255) NOT NULL UNIQUE,
  password       VARCHAR(255),
  name           VARCHAR(255) NOT NULL,
  profile_image  VARCHAR(255),
  role           VARCHAR(20)  DEFAULT 'user',
  oauth_provider VARCHAR(20),
  oauth_id       VARCHAR(255),
  homepage       VARCHAR(255),
  linkedin       VARCHAR(255),
  github         VARCHAR(255),
  company        VARCHAR(255),
  job_title      VARCHAR(255),
  fav_language   VARCHAR(50),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS leet_codes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                VARCHAR(255) NOT NULL,
  description          TEXT NOT NULL,
  examples             TEXT NOT NULL,
  constraints          TEXT NOT NULL,
  test_cases           JSONB NOT NULL,
  expected_outputs     TEXT NOT NULL,
  difficulty           VARCHAR(20) NOT NULL,
  input_format         VARCHAR(50) NOT NULL,
  output_format        VARCHAR(50) NOT NULL,
  function_name        VARCHAR(50) NOT NULL,
  time_limit           INTEGER NOT NULL,
  memory_limit         INTEGER NOT NULL,
  javascript_template  TEXT NOT NULL,
  python_template      TEXT NOT NULL,
  go_template          TEXT NOT NULL,
  java_template        TEXT NOT NULL,
  cpp_template         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_leet_codes_updated_at ON leet_codes;
CREATE TRIGGER update_leet_codes_updated_at
  BEFORE UPDATE ON leet_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS games (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id   UUID NOT NULL,
  opponent_id  UUID,
  leetcode_id  UUID NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'waiting',
  winner_id    UUID,
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT games_creator_id_fkey  FOREIGN KEY (creator_id)  REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT games_opponent_id_fkey FOREIGN KEY (opponent_id) REFERENCES users(id)      ON DELETE SET NULL,
  CONSTRAINT games_leetcode_id_fkey FOREIGN KEY (leetcode_id) REFERENCES leet_codes(id) ON DELETE RESTRICT,
  CONSTRAINT games_winner_id_fkey   FOREIGN KEY (winner_id)   REFERENCES users(id)      ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_games_creator_id  ON games(creator_id);
CREATE INDEX IF NOT EXISTS idx_games_opponent_id ON games(opponent_id);
CREATE INDEX IF NOT EXISTS idx_games_leetcode_id ON games(leetcode_id);
CREATE INDEX IF NOT EXISTS idx_games_status      ON games(status);

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

