/*
  # Allow viewing users from coupling requests
  
  ## Problem
  When viewing coupling requests, the from_user join returns null because
  the RLS policies on users don't allow viewing users outside your family.
  
  ## Solution
  Add a policy that allows viewing users who have sent or received coupling
  requests to/from you.
  
  ## Changes
  1. Add policy to view users from coupling requests
*/

CREATE POLICY "Users can view coupling request participants"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Users who sent me a coupling request
    id IN (
      SELECT from_user_id FROM coupling_requests
      WHERE to_user_id = auth.uid()
    )
    OR
    -- Users who I sent a coupling request to
    id IN (
      SELECT to_user_id FROM coupling_requests
      WHERE from_user_id = auth.uid()
    )
  );
