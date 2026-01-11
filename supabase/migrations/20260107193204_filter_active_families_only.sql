/*
  # Filter to show only active families

  ## Problem
  After merging families, users should only see ACTIVE families, not MERGED ones.

  ## Solution
  Update the SELECT policy on families to filter by status = 'ACTIVE'

  ## Changes
  1. Update "Users can view their families" policy to include status filter
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their families" ON families;

-- Recreate with status filter
CREATE POLICY "Users can view active families"
  ON families FOR SELECT
  TO authenticated
  USING (
    status = 'ACTIVE'
    AND EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = families.id
      AND family_members.user_id = auth.uid()
      AND family_members.status = 'ACTIVE'
    )
  );
