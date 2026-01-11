/*
  # Fix RLS helper functions

  ## Problem
  The is_family_member() and is_family_parent() functions are defined as SECURITY DEFINER,
  which can cause issues with auth.uid() context. They should be SECURITY INVOKER to run
  in the caller's security context.

  ## Changes
  1. Recreate is_family_member() as SECURITY INVOKER
  2. Recreate is_family_parent() as SECURITY INVOKER
  3. Set proper search_path for security

  ## Notes
  - SECURITY INVOKER means the function runs with the privileges of the user calling it
  - This is correct for RLS policies that need to check auth.uid()
*/

-- Recreate is_family_member as SECURITY INVOKER
CREATE OR REPLACE FUNCTION is_family_member(family_uuid uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  );
END;
$$;

-- Recreate is_family_parent as SECURITY INVOKER
CREATE OR REPLACE FUNCTION is_family_parent(family_uuid uuid)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = family_uuid
    AND user_id = auth.uid()
    AND role = 'PARENT'
    AND status = 'ACTIVE'
  );
END;
$$;