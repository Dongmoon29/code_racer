-- Starter code is generated from the function contract. Remove duplicated
-- per-language templates and display-only format columns.
DROP TABLE IF EXISTS io_templates;

ALTER TABLE problems
  DROP COLUMN IF EXISTS input_format,
  DROP COLUMN IF EXISTS output_format;
