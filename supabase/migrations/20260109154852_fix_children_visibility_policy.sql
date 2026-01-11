/*
  # Fix children SELECT policy to respect child_visibility

  ## Problem
  Children are currently visible to all parents in a family, regardless of
  child_visibility settings. This means shared/unshared settings are ignored.

  ## Solution
  Update the SELECT policy to only show children that are either:
  1. Created by you (you're the owner)
  2. Explicitly shared with you (via child_visibility table)

  ## Changes
  1. Drop the old "Parents can view children in their families" policy
  2. Create new policy that checks:
     - created_by = auth.uid() OR
     - EXISTS in child_visibility for auth.uid()

  ## Security
  - Restricts visibility based on explicit grants
  - Creator always has access to their own children
  - Other parents only see children explicitly shared with them
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Parents can view children in their families" ON children;

-- Create new policy that respects child_visibility
CREATE POLICY "Parents can view their own children or children shared with them"
  ON children
  FOR SELECT
  TO authenticated
  USING (
    -- You created this child
    created_by = auth.uid()
    OR
    -- This child has been explicitly shared with you
    EXISTS (
      SELECT 1 FROM child_visibility cv
      WHERE cv.child_id = children.id
      AND cv.user_id = auth.uid()
    )
  );