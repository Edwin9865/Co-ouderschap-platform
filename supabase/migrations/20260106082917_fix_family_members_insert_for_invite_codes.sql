/*
  # Fix family_members INSERT policy for invite code registration

  ## Overview
  When a user registers with an invite code, they need to be able to add themselves
  to the family. The current policy only allows existing parents to add members.
  
  ## Changes
  1. Add new INSERT policy allowing users to add themselves if a valid invite code exists
  2. Keep existing policy for parents inviting other members
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Parents can invite members to their families" ON family_members;

-- Policy 1: Existing parents can invite other users
CREATE POLICY "Parents can add other members to their families"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Parent is adding someone else
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
CREATE POLICY "Users can join families with valid invite code"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid()
    AND EXISTS (
      -- Valid unused invite code exists for this family
      SELECT 1 FROM family_invite_codes
      WHERE family_invite_codes.family_id = family_members.family_id
      AND family_invite_codes.used_at IS NULL
    )
  );
