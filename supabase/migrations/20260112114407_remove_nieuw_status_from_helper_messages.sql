/*
  # Remove NIEUW status from helper_messages
  
  1. Changes
    - Remove NIEUW from status enum, only keep MOET_BEANTWOORDEN and BEANTWOORD
    - Update all existing NIEUW messages to MOET_BEANTWOORDEN
    - Change default status from NIEUW to MOET_BEANTWOORDEN
  
  2. Rationale
    - Simplify message flow: messages start as MOET_BEANTWOORDEN (waiting for response)
    - Remove distinction between "new/unread" and "must answer"
    - Badge count only shows messages with status MOET_BEANTWOORDEN where user is recipient
*/

-- Update all NIEUW messages to MOET_BEANTWOORDEN
UPDATE helper_messages
SET status = 'MOET_BEANTWOORDEN'
WHERE status = 'NIEUW';

-- Drop the old constraint
ALTER TABLE helper_messages 
DROP CONSTRAINT IF EXISTS helper_messages_status_check;

-- Update default value
ALTER TABLE helper_messages 
ALTER COLUMN status SET DEFAULT 'MOET_BEANTWOORDEN';

-- Add new constraint with only MOET_BEANTWOORDEN and BEANTWOORD
ALTER TABLE helper_messages 
ADD CONSTRAINT helper_messages_status_check 
CHECK (status IN ('MOET_BEANTWOORDEN', 'BEANTWOORD'));
