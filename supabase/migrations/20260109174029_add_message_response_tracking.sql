/*
  # Add Message Response Tracking

  1. Changes
    - Add `has_responded_users` JSONB column to `helper_messages` table to track which users have responded to group messages
    - Add index for faster queries
    - Update existing messages with empty array
    
  2. Purpose
    - Track individual parent responses to group messages
    - Allow proper badge management per parent
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'helper_messages' 
    AND column_name = 'has_responded_users'
  ) THEN
    ALTER TABLE helper_messages 
    ADD COLUMN has_responded_users JSONB DEFAULT '[]'::jsonb;
    
    CREATE INDEX IF NOT EXISTS idx_helper_messages_has_responded 
    ON helper_messages USING gin(has_responded_users);
    
    UPDATE helper_messages 
    SET has_responded_users = '[]'::jsonb 
    WHERE has_responded_users IS NULL;
  END IF;
END $$;
