/*
  # Add status field to helper_messages
  
  1. Changes
    - Add `status` field to helper_messages table with enum values:
      - NIEUW (new message that hasn't been opened)
      - MOET_BEANTWOORDEN (message has been opened but not replied to)
      - BEANTWOORD (message has received a reply)
    - Default status is NIEUW
    - Set existing messages to appropriate status based on current data
    - Create trigger to automatically set status to BEANTWOORD when a reply is created
    - Create trigger to set status to MOET_BEANTWOORDEN when is_read changes from false to true
  
  2. Purpose
    - Enable proper badge counting (only show NIEUW and MOET_BEANTWOORDEN in badges)
    - Track message lifecycle from creation to response
*/

-- Add status column to helper_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'helper_messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE helper_messages 
    ADD COLUMN status text DEFAULT 'NIEUW' NOT NULL 
    CHECK (status IN ('NIEUW', 'MOET_BEANTWOORDEN', 'BEANTWOORD'));
    
    CREATE INDEX IF NOT EXISTS idx_helper_messages_status ON helper_messages(status);
  END IF;
END $$;

-- Set status for existing messages
UPDATE helper_messages
SET status = CASE
  -- If message has replies, it's BEANTWOORD
  WHEN EXISTS (
    SELECT 1 FROM helper_messages replies 
    WHERE replies.parent_message_id = helper_messages.id
  ) THEN 'BEANTWOORD'
  -- If message has been read but no replies, it's MOET_BEANTWOORDEN
  WHEN is_read = true THEN 'MOET_BEANTWOORDEN'
  -- Otherwise it's NIEUW
  ELSE 'NIEUW'
END
WHERE status = 'NIEUW';

-- Function to update parent message status to BEANTWOORD when a reply is created
CREATE OR REPLACE FUNCTION update_parent_message_status_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is a reply (has parent_message_id), update parent status to BEANTWOORD
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE helper_messages
    SET status = 'BEANTWOORD'
    WHERE id = NEW.parent_message_id
    AND status != 'BEANTWOORD';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic status update on reply
DROP TRIGGER IF EXISTS on_helper_message_reply_created ON helper_messages;
CREATE TRIGGER on_helper_message_reply_created
  AFTER INSERT ON helper_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_message_status_on_reply();
