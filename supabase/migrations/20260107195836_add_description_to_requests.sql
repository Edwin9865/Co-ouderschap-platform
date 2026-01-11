/*
  # Add description field to requests table

  1. Changes
    - Add `description` column to `requests` table to allow detailed explanation of the request
    - This enables parents to provide context and details when creating a request
    
  2. Notes
    - Description is optional (can be NULL)
    - Allows up to 2000 characters for detailed requests
*/

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'description'
  ) THEN
    ALTER TABLE requests ADD COLUMN description text;
  END IF;
END $$;