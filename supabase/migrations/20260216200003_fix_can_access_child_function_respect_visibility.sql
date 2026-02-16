/*
  # Fix can_access_child Function to Respect Child Visibility

  ## Problem
  The can_access_child() function includes a check for family membership that allows
  ALL family members to access children's events, logs, and requests, even when the
  child is marked as private.

  This creates a privacy leak where:
  - Private children's events are visible to all family members
  - Private children's log entries are visible to all family members  
  - Private children's requests are visible to all family members

  ## Changes
  Update can_access_child() to ONLY allow access if:
  1. User created the child, OR
  2. User has explicit child_visibility grant

  Remove the family membership check that was bypassing visibility controls.

  ## Security
  - Maintains creator access
  - Respects child_visibility table for granular sharing
  - Prevents information leakage through events/logs/requests
  - Aligns with the fixed children SELECT policy

  ## Impact
  - Events, logs, and requests will now be filtered based on child visibility
  - Users will only see data for children they created or have access to
  - Privacy is preserved across all child-related tables
*/

-- Drop and recreate the function with fixed logic
CREATE OR REPLACE FUNCTION can_access_child(child_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  child_creator uuid;
BEGIN
  -- Get the child's creator (bypassing RLS with SECURITY DEFINER)
  SELECT created_by INTO child_creator
  FROM children
  WHERE id = child_uuid;

  -- Allow access if:
  -- 1. You created the child
  -- 2. The child has been explicitly shared with you via child_visibility
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
