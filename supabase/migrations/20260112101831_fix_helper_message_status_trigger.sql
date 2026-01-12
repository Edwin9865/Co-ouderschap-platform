/*
  # Fix helper message status trigger

  ## Changes
  This migration fixes the automatic status update trigger for helper messages.
  The old trigger always set status to BEANTWOORD when any reply was created,
  but this is incorrect behavior.

  ## New Logic
  - When the original sender replies to their own message:
    * Reset has_responded_users to empty array
    * Reset helper_has_read_replies to empty array
    * Set status to 'MOET_BEANTWOORDEN'
  
  - When a recipient replies:
    * For group messages: add user to has_responded_users
    * Set status to 'BEANTWOORD'

  ## Notes
  The frontend also handles status updates, so this trigger provides a safety net
  and ensures consistency even if the frontend logic is bypassed.
*/

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_helper_message_reply_created ON helper_messages;
DROP FUNCTION IF EXISTS update_parent_message_status_on_reply();

-- Create new function with correct logic
CREATE OR REPLACE FUNCTION update_parent_message_status_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_sender_id uuid;
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    SELECT sender_id INTO parent_sender_id
    FROM helper_messages
    WHERE id = NEW.parent_message_id;
    
    IF parent_sender_id = NEW.sender_id THEN
      UPDATE helper_messages
      SET 
        status = 'MOET_BEANTWOORDEN',
        has_responded_users = '[]'::jsonb,
        helper_has_read_replies = ARRAY[]::uuid[]
      WHERE id = NEW.parent_message_id;
    ELSE
      UPDATE helper_messages
      SET 
        status = 'BEANTWOORD',
        has_responded_users = CASE 
          WHEN recipient_id IS NULL AND NOT (has_responded_users @> to_jsonb(NEW.sender_id::text))
          THEN jsonb_set(has_responded_users, '{-1}', to_jsonb(NEW.sender_id::text), true)
          ELSE has_responded_users
        END
      WHERE id = NEW.parent_message_id;
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