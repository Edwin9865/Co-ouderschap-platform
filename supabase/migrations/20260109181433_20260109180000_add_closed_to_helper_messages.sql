/*
  # Add closed field to helper_messages

  1. Changes
    - Add `closed` boolean field to helper_messages table
      - Default is false
      - Allows the original sender to close a message thread
      - When closed, no more replies can be added
    - Add `closed_at` timestamp to track when message was closed
    - Add `closed_by` to track who closed the message
  
  2. Security
    - Only the original sender can close a message
*/

-- Add closed field to helper_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'helper_messages' AND column_name = 'closed'
  ) THEN
    ALTER TABLE helper_messages ADD COLUMN closed boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'helper_messages' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE helper_messages ADD COLUMN closed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'helper_messages' AND column_name = 'closed_by'
  ) THEN
    ALTER TABLE helper_messages ADD COLUMN closed_by uuid REFERENCES users(id);
  END IF;
END $$;
