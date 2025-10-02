-- Add io_schema column to leet_codes with default and backfill
ALTER TABLE leet_codes
ADD COLUMN IF NOT EXISTS io_schema JSONB NOT NULL DEFAULT '{"param_types": [], "return_type": ""}';

-- Touch updated_at via trigger on update (optional explicit backfill not required due to DEFAULT)

