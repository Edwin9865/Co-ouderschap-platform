/*
  # Fix Children Edit/Delete Permissions - Creator Only

  ## Problem
  Current UPDATE and DELETE policies allow ANY parent in the family to edit/delete ANY child.
  This violates the business rule: only the parent who created the child should be able to edit it.

  ## Business Rules
  - Only the creator (created_by) can UPDATE child details (name, color, birth_year)
  - Only the creator (created_by) can DELETE the child
  - Other parents can still VIEW children shared with them via child_visibility
  - Other parents can still manage VISIBILITY settings via child_visibility table

  ## Changes
  1. Drop existing UPDATE and DELETE policies
  2. Create new restrictive policies checking created_by = auth.uid()
*/

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Parents can update children" ON children;
DROP POLICY IF EXISTS "Parents can delete children" ON children;

-- Create new creator-only UPDATE policy
CREATE POLICY "Only creator can update their children"
  ON children
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create new creator-only DELETE policy
CREATE POLICY "Only creator can delete their children"
  ON children
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
