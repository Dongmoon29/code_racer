-- 20251003234500_drop_games_table.down.sql
-- Recreate legacy games table (minimal columns for rollback)

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


