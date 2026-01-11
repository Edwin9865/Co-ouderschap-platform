/*
  # Fix log_entries RLS to respect child visibility

  ## Problem
  Log entries are currently visible to all family members, even if they're linked
  to children that haven't been shared with them.

  ## Solution
  Update SELECT policy to check:
  - If child_id is NULL: visible to all family members
  - If child_id is set: only visible if you have access to that child

  ## Changes
  1. Drop old SELECT policy for log_entries
  2. Create new SELECT policy that checks child visibility

  ## Security
  - General family log entries (child_id = NULL) are visible to all family members
  - Child-specific log entries are only visible if you have access to that child
*/

-- Drop old log_entries SELECT policy
DROP POLICY IF EXISTS "Users can view log entries in their families" ON log_entries;

-- Create new log_entries SELECT policy that respects child visibility
CREATE POLICY "Users can view log entries in their families"
  ON log_entries
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      -- General family log entry (no specific child)
      child_id IS NULL
      OR
      -- Child-specific log entry and user has access to the child
      can_access_child(child_id)
    )
  );