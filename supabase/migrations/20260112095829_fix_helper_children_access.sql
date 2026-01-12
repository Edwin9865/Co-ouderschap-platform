/*
  # Fix helper access to children

  ## Problem
  Helpers cannot see children in families they are members of because the
  children SELECT policy only checks:
  1. If user created the child (created_by = auth.uid())
  2. If child is explicitly shared with user via child_visibility

  Helpers need to see all children in families where they are active members.

  ## Solution
  Update the children SELECT policy to include a check for family membership.
  Helpers who are active members of a family should be able to see all children
  in that family.

  ## Changes
  1. Drop existing children SELECT policy
  2. Create new policy that includes family membership check
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Parents can view own or shared children" ON children;

-- Create new policy with family membership check for helpers
CREATE POLICY "Users can view children in their families"
  ON children
  FOR SELECT
  TO authenticated
  USING (
    -- Can see if you created the child
    created_by = auth.uid()
    OR
    -- Can see if child is explicitly shared with you
    has_child_visibility(id, auth.uid())
    OR
    -- Can see if you're a family member (includes helpers)
    is_family_member(family_id)
  );
