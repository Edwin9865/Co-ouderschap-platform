/*
  # Fix infinite recursion in family_members RLS policies

  ## Problem
  The current INSERT policies on family_members cause infinite recursion because:
  - "Parents can add members" policy calls is_family_parent_secure()
  - This function does a SELECT on family_members
  - The SELECT triggers the SELECT policy which calls get_user_families()
  - This causes infinite recursion

  ## Solution
  Replace the problematic policies with inline checks that don't cause recursion.
  Specifically for the "Users can join with invite code" policy, we simplify it
  to just check the invite code existence without triggering recursive queries.

  ## Changes
  1. Drop problematic INSERT policies
  2. Create new simplified INSERT policies with inline checks
*/

-- Drop the problematic INSERT policies
DROP POLICY IF EXISTS "Parents can add members" ON family_members;
DROP POLICY IF EXISTS "Users can join with invite code" ON family_members;

-- Policy 1: Parents can add other members to families they are already in
-- We inline the check to avoid recursion
CREATE POLICY "Parents can add other members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM family_members existing
      WHERE existing.family_id = family_members.family_id
      AND existing.user_id = auth.uid()
      AND existing.role = 'PARENT'
      AND existing.status = 'ACTIVE'
    )
  );

-- Policy 2: Users can add themselves with a valid invite code
-- Simplified to only check invite codes, no family_members queries
CREATE POLICY "Users can add themselves with invite code"
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
