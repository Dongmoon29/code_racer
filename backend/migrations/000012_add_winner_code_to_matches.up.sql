-- Persist the accepted source code so completed matches can display the actual
-- winning submission after a reload or reconnect.
ALTER TABLE matches ADD COLUMN winner_code TEXT;
