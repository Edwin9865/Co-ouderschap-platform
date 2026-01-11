/*
  # Improve children SELECT policy to avoid chicken-and-egg problem

  ## Problem
  After INSERT, the trigger creates a child_visibility record, but the SELECT
  that returns the inserted child might run before the trigger completes,
  causing the INSERT to fail.

  ## Solution
  Allow parents to see children in their families if:
  1. They have explicit visibility (child_visibility record), OR
  2. They are a parent in the family and no child_visibility records exist yet
     (this handles the moment right after creation)

  ## Changes
  1. Drop current policy
  2. Create new policy that handles both cases
*/

DROP POLICY IF EXISTS "Parents can view children with visibility" ON children;

-- New policy: Parents can see children if they have visibility OR if they're in the family
CREATE POLICY "Parents can view children in their families"
  ON children FOR SELECT
  TO authenticated
  USING (
    -- User is a parent in this family
    is_family_parent(family_id)
    AND (
      -- Either: they have explicit visibility
      EXISTS (
        SELECT 1 FROM child_visibility cv
        WHERE cv.child_id = children.id
        AND cv.user_id = auth.uid()
      )
      -- Or: no visibility restrictions exist yet for this child (just created)
      OR NOT EXISTS (
        SELECT 1 FROM child_visibility cv
        WHERE cv.child_id = children.id
      )
    )
  );