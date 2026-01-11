/*
  # Fix Subscription Insert Timing Issue

  ## Problem
  When creating a new family, the subscription insert fails because
  the RLS policy checks if user is a parent, but the family_member
  record was just created and may not be visible yet.

  ## Solution
  Simplify the subscription INSERT policy to just check if the user
  is authenticated and there's a corresponding family_member record
  (even if just created).
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Parents can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription creation for new families" ON subscriptions;

-- Create a simpler INSERT policy that works with new families
CREATE POLICY "Authenticated users can create subscriptions for their families"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be a member of the family
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = subscriptions.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'PARENT'
    )
  );