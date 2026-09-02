ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS input_format VARCHAR(50) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS output_format VARCHAR(50) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS io_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_io_templates_problem_id ON io_templates(problem_id);
CREATE INDEX IF NOT EXISTS idx_io_templates_language ON io_templates(language);

DROP TRIGGER IF EXISTS update_io_templates_updated_at ON io_templates;
CREATE TRIGGER update_io_templates_updated_at
  BEFORE UPDATE ON io_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
