-- 20251003233000_create_matches_table.up.sql
-- Create matches table aligned with backend/internal/model/match.go

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS matches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_a_id  UUID        NOT NULL,
  player_b_id  UUID,
  leetcode_id  UUID        NOT NULL,
  winner_id    UUID,
  mode         VARCHAR(20) NOT NULL DEFAULT 'casual_pvp',
  status       VARCHAR(20) NOT NULL DEFAULT 'waiting',
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT matches_player_a_id_fkey  FOREIGN KEY (player_a_id) REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT matches_player_b_id_fkey  FOREIGN KEY (player_b_id) REFERENCES users(id)      ON DELETE SET NULL,
  CONSTRAINT matches_leetcode_id_fkey  FOREIGN KEY (leetcode_id) REFERENCES leet_codes(id) ON DELETE RESTRICT,
  CONSTRAINT matches_winner_id_fkey    FOREIGN KEY (winner_id)   REFERENCES users(id)      ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_player_a_id ON matches(player_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_player_b_id ON matches(player_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_leetcode_id ON matches(leetcode_id);
CREATE INDEX IF NOT EXISTS idx_matches_status      ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_mode        ON matches(mode);

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


