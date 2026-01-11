/*
  # Add last_action_by field to requests table

  1. Changes
    - Add `last_action_by` column to `requests` table to track who performed the last action
    - This enables proper turn-based request handling where only the person who didn't perform the last action can respond
    - Create trigger to automatically set last_action_by to created_by for new requests
    - Update existing requests to set last_action_by to created_by
    
  2. Notes
    - When a request is created, last_action_by = created_by
    - When someone accepts/declines/counters, last_action_by is updated to that person
    - Only the person where last_action_by != user_id can see action buttons
*/

-- Add last_action_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'last_action_by'
  ) THEN
    ALTER TABLE requests ADD COLUMN last_action_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Set last_action_by to created_by for existing requests
UPDATE requests
SET last_action_by = created_by
WHERE last_action_by IS NULL;

-- Make last_action_by NOT NULL
ALTER TABLE requests ALTER COLUMN last_action_by SET NOT NULL;

-- Create trigger function to set last_action_by on insert
CREATE OR REPLACE FUNCTION set_request_last_action_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_action_by IS NULL THEN
    NEW.last_action_by := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_request_last_action_by ON requests;
CREATE TRIGGER trigger_set_request_last_action_by
  BEFORE INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION set_request_last_action_by();