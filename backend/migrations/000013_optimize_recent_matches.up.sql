CREATE INDEX IF NOT EXISTS idx_matches_player_a_status_created_at
  ON matches(player_a_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_player_b_status_created_at
  ON matches(player_b_id, status, created_at DESC);
