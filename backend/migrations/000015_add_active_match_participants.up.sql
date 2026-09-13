CREATE TABLE IF NOT EXISTS active_match_participants (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_match_participants_match_id
    ON active_match_participants(match_id);

-- Preserve at most the newest unfinished match per user when upgrading an
-- existing database. New writes are protected by the primary key above.
WITH participants AS (
    SELECT player_a_id AS user_id, id AS match_id, created_at
    FROM matches
    WHERE status IN ('waiting', 'playing')
    UNION ALL
    SELECT player_b_id AS user_id, id AS match_id, created_at
    FROM matches
    WHERE player_b_id IS NOT NULL AND status IN ('waiting', 'playing')
), ranked AS (
    SELECT user_id, match_id, created_at,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS row_number
    FROM participants
)
INSERT INTO active_match_participants(user_id, match_id, created_at)
SELECT user_id, match_id, created_at
FROM ranked
WHERE row_number = 1
ON CONFLICT (user_id) DO NOTHING;
