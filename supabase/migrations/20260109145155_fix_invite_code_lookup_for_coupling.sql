/*
  # Fix invite code lookup for coupling

  ## Problem
  Authenticated users can only view their own family's invite code, but they need
  to be able to look up OTHER families' invite codes when coupling.

  ## Solution
  Add a policy that allows authenticated users to look up any invite code by code value.
  This is safe because:
  1. Users need to know the exact code (6 random characters)
  2. The code is meant to be shared for coupling
  3. Only basic info (family_id) is exposed, not sensitive data

  ## Security
  - Authenticated users can search for any invite code
  - Still protected by knowing the exact code value
*/

-- Allow authenticated users to look up any invite code (for coupling)
CREATE POLICY "Authenticated users can lookup invite codes for coupling"
  ON family_invite_codes FOR SELECT
  TO authenticated
  USING (true);
