/*
  # Add counter proposal and decline reason fields to requests

  1. Changes
    - Add `counter_proposal` column to store the counter proposal text
    - Add `decline_reason` column to store the reason for declining
    - These fields replace the message-based approach for better visibility
    
  2. Notes
    - Both fields are optional (can be NULL)
    - Allows up to 1000 characters for detailed explanations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'counter_proposal'
  ) THEN
    ALTER TABLE requests ADD COLUMN counter_proposal text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'decline_reason'
  ) THEN
    ALTER TABLE requests ADD COLUMN decline_reason text;
  END IF;
END $$;