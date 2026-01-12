/*
  # Fix helper message status trigger (v2)

  ## Changes
  Fix the trigger function to properly handle jsonb array for has_responded_users.
  The previous version had incorrect jsonb manipulation.

  ## New Logic
  - When the original sender replies: reset status to MOET_BEANTWOORDEN
  - When a recipient replies: set status to BEANTWOORD and update has_responded_users
*/

-- Drop and recreate the function with corrected jsonb handling
DROP TRIGGER IF EXISTS on_helper_message_reply_created ON helper_messages;
DROP FUNCTION IF EXISTS update_parent_message_status_on_reply();

CREATE OR REPLACE FUNCTION update_parent_message_status_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_sender_id uuid;
  parent_recipient_id uuid;
  current_responders jsonb;
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT sender_id, recipient_id, has_responded_users 
    INTO parent_sender_id, parent_recipient_id, current_responders
    FROM helper_messages
    WHERE id = NEW.parent_message_id;
    
    -- If the parent message sender is replying (original sender responds)
    IF parent_sender_id = NEW.sender_id THEN
      UPDATE helper_messages
      SET 
        status = 'MOET_BEANTWOORDEN',
        has_responded_users = '[]'::jsonb,
        helper_has_read_replies = ARRAY[]::uuid[]
      WHERE id = NEW.parent_message_id;
    ELSE
      -- A recipient is replying
      -- For group messages, add to has_responded_users if not already there
      IF parent_recipient_id IS NULL THEN
        -- Check if user already in array
        IF NOT (current_responders @> to_jsonb(ARRAY[NEW.sender_id::text])) THEN
          current_responders = current_responders || to_jsonb(ARRAY[NEW.sender_id::text]);
        END IF;
        
        UPDATE helper_messages
        SET 
          status = 'BEANTWOORD',
          has_responded_users = current_responders
        WHERE id = NEW.parent_message_id;
      ELSE
        -- Direct message
        UPDATE helper_messages
        SET status = 'BEANTWOORD'
        WHERE id = NEW.parent_message_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_helper_message_reply_created
  AFTER INSERT ON helper_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_message_status_on_reply();