/*
  # Fix infinite recursion in children and child_visibility policies

  ## Problem
  - children SELECT policy queries child_visibility with RLS
  - child_visibility SELECT policy queries children with RLS
  - This creates infinite recursion: "infinite recursion detected in policy for relation children"

  ## Solution
  Use SECURITY DEFINER functions to break the circular dependency.
  Both tables need to query each other without triggering RLS.

  ## Changes
  1. Create helper function to check child_visibility without RLS
  2. Update children SELECT policy to use this function
  3. Simplify child_visibility SELECT policy to avoid querying children
*/

-- Create function to check if user has visibility (bypasses RLS)
CREATE OR REPLACE FUNCTION has_child_visibility(child_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM child_visibility
    WHERE child_id = child_uuid
    AND user_id = user_uuid
  );
$$;

-- Create function to check if user created child (bypasses RLS)
CREATE OR REPLACE FUNCTION is_child_creator(child_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM children
    WHERE id = child_uuid
    AND created_by = user_uuid
  );
$$;

-- Drop and recreate children SELECT policy without circular dependency
DROP POLICY IF EXISTS "Parents can view their own children or children shared with the" ON children;

CREATE POLICY "Parents can view own or shared children"
  ON children
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    has_child_visibility(id, auth.uid())
  );

-- Drop and recreate child_visibility SELECT policy without circular dependency
DROP POLICY IF EXISTS "Users can view visibility for accessible children" ON child_visibility;

CREATE POLICY "Users can view visibility records"
  ON child_visibility
  FOR SELECT
  TO authenticated
  USING (
    -- Can see if you granted the visibility
    granted_by = auth.uid()
    OR
    -- Can see if you're receiving the visibility
    user_id = auth.uid()
    OR
    -- Can see if you created the child
    is_child_creator(child_id, auth.uid())
  );