/*
  # Fix family SELECT policy for INSERT operations

  ## Problem
  When a user creates a new family:
  1. INSERT succeeds (WITH CHECK true allows it)
  2. But `.select()` after INSERT fails
  3. SELECT policy checks if user is a family_member
  4. User is not yet a member (hasn't been added yet)
  5. SELECT fails, causing the whole operation to fail

  ## Solution
  Allow SELECT on families created within the last minute.
  This gives time for the complete flow:
  - Create family
  - Add user as family_member
  - Create subscription

  ## Changes
  - Update SELECT policy on families table
  - Add temporal condition: created_at > now() - 1 minute
*/

DROP POLICY IF EXISTS "Users can view their families" ON families;

CREATE POLICY "Users can view their families"
  ON families FOR SELECT
  TO authenticated
  USING (
    -- Standard check: user is a member of this family
    id IN (
      SELECT family_id
      FROM family_members
      WHERE user_id = auth.uid()
    )
    OR
    -- Allow viewing families just created (within 1 minute)
    -- This allows the SELECT after INSERT to work before member is added
    created_at > (now() - interval '1 minute')
  );
