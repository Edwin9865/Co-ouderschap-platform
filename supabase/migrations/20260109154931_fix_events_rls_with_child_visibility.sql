/*
  # Fix events RLS to respect child visibility

  ## Problem
  Events are currently visible to all family members, even if they're linked
  to children that haven't been shared with them.

  ## Solution
  Update SELECT policy to check:
  - If child_id is NULL: visible to all family members
  - If child_id is set: only visible if you have access to that child

  ## Changes
  1. Create helper function to check child access
  2. Drop old SELECT policy for events
  3. Create new SELECT policy that checks child visibility

  ## Security
  - General family events (child_id = NULL) are visible to all family members
  - Child-specific events are only visible if you have access to that child
*/

-- Helper function to check if user has access to a child
CREATE OR REPLACE FUNCTION can_access_child(child_uuid uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM children
    WHERE id = child_uuid
    AND (
      -- You created this child
      created_by = auth.uid()
      OR
      -- This child has been shared with you
      EXISTS (
        SELECT 1 FROM child_visibility cv
        WHERE cv.child_id = child_uuid
        AND cv.user_id = auth.uid()
      )
    )
  );
END;
$$;

-- Drop old events SELECT policy
DROP POLICY IF EXISTS "Users can view events in their families" ON events;

-- Create new events SELECT policy that respects child visibility
CREATE POLICY "Users can view events in their families"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      -- General family event (no specific child)
      child_id IS NULL
      OR
      -- Child-specific event and user has access to the child
      can_access_child(child_id)
    )
  );