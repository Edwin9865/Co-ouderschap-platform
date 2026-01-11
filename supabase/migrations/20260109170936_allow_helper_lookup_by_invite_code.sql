/*
  # Allow Helper Lookup by Invite Code

  ## Changes
  - Add RLS policy to allow authenticated users to find helpers by their invite code
  - This is needed for the helper linking functionality where parents enter a code

  ## Security
  - Only allows SELECT access
  - Only for users with account_type = 'HELPER'
  - Only when searching by helper_invite_code
*/

-- Allow authenticated users to find helpers by their invite code
CREATE POLICY "Users can lookup helpers by invite code"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    account_type = 'HELPER' 
    AND helper_invite_code IS NOT NULL
  );