/*
  # Remove circular dependency between children and child_visibility

  ## Problem
  - Children SELECT policy checks child_visibility table
  - Child_visibility SELECT policy checks children table
  - This creates infinite recursion: children → child_visibility → children → ...

  ## Solution
  Simplify the approach:
  - Children SELECT: Parents in a family can see ALL children in that family
  - Child_visibility: Just metadata indicating which children are "shared"
  - The app uses child_visibility to show visual indicators, not for access control

  ## Changes
  1. Simplify children SELECT policy to not check child_visibility
  2. Keep child_visibility policies as-is (they can reference children safely)
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Parents can view children in their families" ON children;

-- Create simple, non-recursive policy
-- Parents can see all children in families where they are a parent
CREATE POLICY "Parents can view children in their families"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = children.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'PARENT'
      AND fm.status = 'ACTIVE'
    )
  );