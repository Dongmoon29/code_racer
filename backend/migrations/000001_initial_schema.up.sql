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
  rating         INTEGER DEFAULT 1000,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Problems table (main table)
CREATE TABLE IF NOT EXISTS problems (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  constraints   TEXT NOT NULL,
  difficulty    VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  input_format  VARCHAR(50) NOT NULL,
  output_format VARCHAR(50) NOT NULL,
  function_name VARCHAR(50) NOT NULL,
  time_limit    INTEGER NOT NULL,
  memory_limit  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Examples table
CREATE TABLE IF NOT EXISTS examples (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id  UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input       TEXT,
  output      TEXT,
  explanation TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id     UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input          TEXT,
  expected_output TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- IO Templates table (language-specific templates)
CREATE TABLE IF NOT EXISTS io_templates (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  language  VARCHAR(20) NOT NULL,
  code      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- IO Schemas table
CREATE TABLE IF NOT EXISTS io_schemas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id  UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  param_types TEXT NOT NULL, -- JSON string
  return_type VARCHAR(50) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for normalized tables
CREATE INDEX IF NOT EXISTS idx_examples_problem_id ON examples(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases(problem_id);
CREATE INDEX IF NOT EXISTS idx_io_templates_problem_id ON io_templates(problem_id);
CREATE INDEX IF NOT EXISTS idx_io_templates_language ON io_templates(language);
CREATE INDEX IF NOT EXISTS idx_io_schemas_problem_id ON io_schemas(problem_id);

-- Triggers for normalized tables
DROP TRIGGER IF EXISTS update_problems_updated_at ON problems;
CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_examples_updated_at ON examples;
CREATE TRIGGER update_examples_updated_at
  BEFORE UPDATE ON examples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON test_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_io_templates_updated_at ON io_templates;
CREATE TRIGGER update_io_templates_updated_at
  BEFORE UPDATE ON io_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_io_schemas_updated_at ON io_schemas;
CREATE TRIGGER update_io_schemas_updated_at
  BEFORE UPDATE ON io_schemas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Matches table (replaces games table)
CREATE TABLE IF NOT EXISTS matches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_a_id  UUID        NOT NULL,
  player_b_id  UUID,
  problem_id   UUID        NOT NULL,
  winner_id    UUID,
  mode         VARCHAR(20) NOT NULL DEFAULT 'casual_pvp',
  status       VARCHAR(20) NOT NULL DEFAULT 'waiting',
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT matches_player_a_id_fkey  FOREIGN KEY (player_a_id) REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT matches_player_b_id_fkey  FOREIGN KEY (player_b_id) REFERENCES users(id)      ON DELETE SET NULL,
  CONSTRAINT matches_problem_id_fkey   FOREIGN KEY (problem_id)  REFERENCES problems(id)   ON DELETE RESTRICT,
  CONSTRAINT matches_winner_id_fkey    FOREIGN KEY (winner_id)   REFERENCES users(id)      ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_player_a_id ON matches(player_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_b_id ON matches(player_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_problem_id  ON matches(problem_id);
CREATE INDEX IF NOT EXISTS idx_matches_status      ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_mode        ON matches(mode);

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

