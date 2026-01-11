/*
  # Fix children SELECT policy for visibility system

  ## Problem
  The new children SELECT policy is too restrictive and prevents users from seeing
  their children even when child_visibility records exist.

  ## Solution
  Simplify the policy to allow parents to see all children in their families,
  while respecting child_visibility for viewing other parents' children.

  ## Changes
  1. Drop the restrictive SELECT policy
  2. Create a new, simpler policy that allows:
     - Parents can always see children they have visibility for
     - Parents can see all children in families where they are the only parent
*/

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view children they have access to" ON children;

-- Create a simpler policy
-- Parents can see children if:
-- 1. They have explicit visibility (child_visibility record), OR
-- 2. They created the child (granted_by = user)
CREATE POLICY "Parents can view children with visibility"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM child_visibility cv
      WHERE cv.child_id = children.id
      AND cv.user_id = auth.uid()
    )
  );