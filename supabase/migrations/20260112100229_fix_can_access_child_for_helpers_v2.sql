/*
  # Fix can_access_child function for helpers

  ## Problem
  The can_access_child function only checks:
  1. If user created the child
  2. If child is explicitly shared via child_visibility
  
  But helpers should be able to access all children in families where they
  are active members (same logic as the children SELECT policy).

  ## Solution
  Update can_access_child to also check if user is a family member of the
  child's family.

  ## Changes
  1. Drop dependent policies first
  2. Drop and recreate can_access_child function with family membership check
  3. Recreate policies
*/

-- Drop policies that depend on the function
DROP POLICY IF EXISTS "Users can view events in their families" ON events;
DROP POLICY IF EXISTS "Users can view log entries in their families" ON log_entries;
DROP POLICY IF EXISTS "Users can view requests in their families" ON requests;

-- Drop and recreate the function with family membership check
DROP FUNCTION IF EXISTS can_access_child(uuid);

CREATE OR REPLACE FUNCTION can_access_child(child_uuid uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_creator uuid;
  child_family_id uuid;
BEGIN
  -- Get the child's creator and family_id (bypassing RLS with SECURITY DEFINER)
  SELECT created_by, family_id INTO child_creator, child_family_id
  FROM children
  WHERE id = child_uuid;
  
  -- Allow access if:
  -- 1. You created the child
  -- 2. The child has been explicitly shared with you via child_visibility
  -- 3. You are an active member of the child's family (includes helpers)
  RETURN (
    child_creator = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM child_visibility
      WHERE child_id = child_uuid
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = child_family_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
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
