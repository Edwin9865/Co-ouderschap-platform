/*
  # Fix requests RLS to respect child visibility

  ## Problem
  Requests are currently visible to all family members, even if they're linked
  to children that haven't been shared with them.

  ## Solution
  Update SELECT policy to check:
  - If child_id is NULL: visible to all family members
  - If child_id is set: only visible if you have access to that child

  ## Changes
  1. Drop old SELECT policy for requests
  2. Create new SELECT policy that checks child visibility

  ## Security
  - General family requests (child_id = NULL) are visible to all family members
  - Child-specific requests are only visible if you have access to that child
*/

-- Drop old requests SELECT policy
DROP POLICY IF EXISTS "Users can view requests in their families" ON requests;

-- Create new requests SELECT policy that respects child visibility
CREATE POLICY "Users can view requests in their families"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      -- General family request (no specific child)
      child_id IS NULL
      OR
      -- Child-specific request and user has access to the child
      can_access_child(child_id)
    )
  );