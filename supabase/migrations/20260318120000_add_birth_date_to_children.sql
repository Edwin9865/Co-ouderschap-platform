-- Add birth_date (date) column to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS birth_date date;

-- Migrate existing birth_year data to birth_date (January 1st of that year as fallback)
UPDATE children
SET birth_date = make_date(birth_year, 1, 1)
WHERE birth_year IS NOT NULL AND birth_date IS NULL;

-- Update events type CHECK constraint to include 'birthday'
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events ADD CONSTRAINT events_type_check
  CHECK (type IN ('medical', 'school', 'sport', 'handover', 'other', 'birthday'));
