/*
  # Rebuild families INSERT policy

  ## Problem
  The INSERT policy exists but RLS is blocking inserts from authenticated users.
  
  ## Solution
  Drop all policies and recreate them with explicit configuration.
  
  ## Changes
  1. Drop all existing policies on families
  2. Recreate INSERT policy with explicit USING and WITH CHECK
  3. Recreate other policies
*/

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create families" ON families;
DROP POLICY IF EXISTS "Users can view their families" ON families;
DROP POLICY IF EXISTS "Parents can update their families" ON families;

-- ============================================================================
-- RECREATE POLICIES
-- ============================================================================

-- INSERT: Any authenticated user can create a family
CREATE POLICY "Authenticated users can create families"
  ON families
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SELECT: Users can view families they are members of
CREATE POLICY "Users can view their families"
  ON families
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_user_families()));

-- UPDATE: Parents can update their families
CREATE POLICY "Parents can update their families"
  ON families
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (is_family_parent(id))
  WITH CHECK (is_family_parent(id));