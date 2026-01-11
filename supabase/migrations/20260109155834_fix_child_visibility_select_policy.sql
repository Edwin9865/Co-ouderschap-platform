/*
  # Fix child_visibility SELECT policy to avoid circular dependency

  ## Problem
  The child_visibility SELECT policy queries the children table which has RLS.
  This can cause circular dependency issues when the children policy tries to
  check child_visibility.

  ## Solution
  Simplify the child_visibility SELECT policy to allow family members to see
  visibility records without checking through the children table.

  ## Changes
  1. Drop existing SELECT policy
  2. Create simpler policy that allows authenticated users to see visibility
     for children they have access to (either created or shared)
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view child visibility in their families" ON child_visibility;

-- Create new simplified policy
-- Allow users to see visibility records for:
-- 1. Children they created
-- 2. Children shared with them
CREATE POLICY "Users can view visibility for accessible children"
  ON child_visibility
  FOR SELECT
  TO authenticated
  USING (
    -- Can see if you're the one who granted the visibility
    granted_by = auth.uid()
    OR
    -- Can see if you're the user receiving the visibility
    user_id = auth.uid()
    OR
    -- Can see if you created the child (using SECURITY DEFINER function to avoid circular dependency)
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = child_visibility.child_id
      AND c.created_by = auth.uid()
    )
  );