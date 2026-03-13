-- Fix UPDATE RLS policy for helper_messages
-- Problem: helpers can only update messages they sent (sender_id = auth.uid()).
--          This blocks helpers from closing parent-initiated messages.
-- Solution: also allow helpers (account_type = 'HELPER') to update any message
--           in a family they are an active member of.

DROP POLICY IF EXISTS "Users can update their own messages" ON helper_messages;

CREATE POLICY "Users can update messages"
  ON helper_messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM family_members fm
      JOIN users u ON u.id = auth.uid()
      WHERE fm.family_id = helper_messages.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'ACTIVE'
        AND u.account_type = 'HELPER'
    )
  )
  WITH CHECK (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM family_members fm
      JOIN users u ON u.id = auth.uid()
      WHERE fm.family_id = helper_messages.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'ACTIVE'
        AND u.account_type = 'HELPER'
    )
  );
