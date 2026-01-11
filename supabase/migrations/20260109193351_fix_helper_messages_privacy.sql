/*
  # Fix Helper Messages Privacy
  
  ## Problem
  Private messages sent to individual parents are visible to all family members.
  
  ## Solution
  Update the SELECT policy to ensure:
  1. Users can see messages they sent (sender_id = auth.uid())
  2. Users can see messages sent TO them (recipient_id = auth.uid())
  3. Users can see group messages (recipient_id IS NULL) if they're active family members
  
  ## Security
  - Private messages are only visible to sender and recipient
  - Group messages are visible to all active family members
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Family members can view messages" ON helper_messages;

-- Create new restrictive policy
CREATE POLICY "Users can view their messages"
  ON helper_messages
  FOR SELECT
  TO authenticated
  USING (
    -- Can see if you're the sender
    sender_id = auth.uid()
    OR
    -- Can see if you're the recipient
    recipient_id = auth.uid()
    OR
    -- Can see group messages (recipient_id IS NULL) if you're an active family member
    (
      recipient_id IS NULL 
      AND EXISTS (
        SELECT 1 
        FROM family_members fm 
        WHERE fm.family_id = helper_messages.family_id 
          AND fm.user_id = auth.uid() 
          AND fm.status = 'ACTIVE'
      )
    )
  );