/*
  # Fix SELECT policy recursion on family_members

  ## Problem
  The SELECT policy calls get_user_families() which does a SELECT on family_members,
  causing recursion when any policy tries to check family membership.

  ## Solution
  Replace the SELECT policy with an inline version that doesn't use functions.

  ## Changes
  1. Drop the SELECT policy that uses get_user_families()
  2. Create new SELECT policy with inline subquery
*/

-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view family members in their families" ON family_members;

-- Create new SELECT policy with inline check (no function calls)
CREATE POLICY "Users can view family members"
  ON family_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members my_membership
      WHERE my_membership.family_id = family_members.family_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.status = 'ACTIVE'
    )
  );
