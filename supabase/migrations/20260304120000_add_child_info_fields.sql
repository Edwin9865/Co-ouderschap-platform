/*
  # Add child info fields

  Adds extra info fields to the children table:
  - clothing_size, shoe_size (maten)
  - insurance, meds_allergy, vaccinations (medisch)
  - social_security_num, passport_num, passport_location, other_info (documenten)
  - accounts_notes (accounts tab)
*/

DO $$
BEGIN
  -- Maten
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'clothing_size') THEN
    ALTER TABLE children ADD COLUMN clothing_size text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'shoe_size') THEN
    ALTER TABLE children ADD COLUMN shoe_size text;
  END IF;

  -- Medisch
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'insurance') THEN
    ALTER TABLE children ADD COLUMN insurance text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'meds_allergy') THEN
    ALTER TABLE children ADD COLUMN meds_allergy text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'vaccinations') THEN
    ALTER TABLE children ADD COLUMN vaccinations text;
  END IF;

  -- Documenten
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'social_security_num') THEN
    ALTER TABLE children ADD COLUMN social_security_num text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'passport_num') THEN
    ALTER TABLE children ADD COLUMN passport_num text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'passport_location') THEN
    ALTER TABLE children ADD COLUMN passport_location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'other_info') THEN
    ALTER TABLE children ADD COLUMN other_info text;
  END IF;

  -- Accounts tab
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'accounts_notes') THEN
    ALTER TABLE children ADD COLUMN accounts_notes text;
  END IF;
END $$;
