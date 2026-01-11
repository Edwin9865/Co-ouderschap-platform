/*
  # Fix can_access_child function to avoid circular dependency

  ## Problem
  The can_access_child function queries the children table, which has RLS enabled.
  This creates a circular dependency when RLS policies for events/logs/requests
  try to use this function.

  ## Solution
  Simplify the function to ONLY check child_visibility table directly.
  Use SECURITY DEFINER to bypass RLS when checking created_by.

  ## Changes
  1. Drop dependent policies
  2. Replace can_access_child function with simpler version
  3. Recreate policies
*/

-- Drop policies that depend on the function
DROP POLICY IF EXISTS "Users can view events in their families" ON events;
DROP POLICY IF EXISTS "Users can view log entries in their families" ON log_entries;
DROP POLICY IF EXISTS "Users can view requests in their families" ON requests;

-- Drop and recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS can_access_child(uuid);

CREATE OR REPLACE FUNCTION can_access_child(child_uuid uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_creator uuid;
BEGIN
  -- Get the creator of the child (bypassing RLS with SECURITY DEFINER)
  SELECT created_by INTO child_creator
  FROM children
  WHERE id = child_uuid;
  
  -- Allow access if:
  -- 1. You created the child
  -- 2. The child has been explicitly shared with you
  RETURN (
    child_creator = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM child_visibility
      WHERE child_id = child_uuid
      AND user_id = auth.uid()
    )
  );
END;
$$;

-- Recreate events SELECT policy
CREATE POLICY "Users can view events in their families"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      child_id IS NULL
      OR
      can_access_child(child_id)
    )
  );

-- Recreate log_entries SELECT policy
CREATE POLICY "Users can view log entries in their families"
  ON log_entries
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      child_id IS NULL
      OR
      can_access_child(child_id)
    )
  );

-- Recreate requests SELECT policy
CREATE POLICY "Users can view requests in their families"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      child_id IS NULL
      OR
      can_access_child(child_id)
    )
  );