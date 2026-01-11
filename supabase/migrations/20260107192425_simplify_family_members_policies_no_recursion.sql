/*
  # Simplify family_members policies to avoid all recursion

  ## Problem
  Any policy on family_members that does a subquery on family_members itself
  causes infinite recursion, because the subquery triggers the same policies.

  ## Solution
  Use SECURITY DEFINER functions that bypass RLS for the recursive checks.
  This allows us to check membership without triggering policy recursion.

  ## Changes
  1. Create SECURITY DEFINER helper function
  2. Rebuild all family_members policies using this function
*/

-- Drop ALL existing family_members policies
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Parents can add other members" ON family_members;
DROP POLICY IF EXISTS "Users can add themselves with invite code" ON family_members;
DROP POLICY IF EXISTS "Parents can update family members" ON family_members;
DROP POLICY IF EXISTS "Parents can remove family members" ON family_members;

-- Create a SECURITY DEFINER function that bypasses RLS
-- This prevents infinite recursion
CREATE OR REPLACE FUNCTION check_family_membership(
  check_family_id uuid,
  check_user_id uuid,
  check_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_role IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = check_family_id
      AND user_id = check_user_id
      AND status = 'ACTIVE'
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM family_members
      WHERE family_id = check_family_id
      AND user_id = check_user_id
      AND role = check_role
      AND status = 'ACTIVE'
    );
  END IF;
END;
$$;

-- SELECT: Users can view members of families they belong to
CREATE POLICY "Users can view their family members"
  ON family_members FOR SELECT
  TO authenticated
  USING (
    check_family_membership(family_id, auth.uid())
  );

-- INSERT: Users can add themselves with valid invite code
CREATE POLICY "Users can join with invite code"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM family_invite_codes
      WHERE family_invite_codes.family_id = family_members.family_id
      AND family_invite_codes.used_at IS NULL
    )
  );

-- INSERT: Parents can add others to their family
CREATE POLICY "Parents can invite others"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND check_family_membership(family_id, auth.uid(), 'PARENT')
  );

-- UPDATE: Parents can update family members
CREATE POLICY "Parents can update members"
  ON family_members FOR UPDATE
  TO authenticated
  USING (check_family_membership(family_id, auth.uid(), 'PARENT'))
  WITH CHECK (check_family_membership(family_id, auth.uid(), 'PARENT'));

-- DELETE: Parents can remove family members
CREATE POLICY "Parents can remove members"
  ON family_members FOR DELETE
  TO authenticated
  USING (check_family_membership(family_id, auth.uid(), 'PARENT'));
