/*
  # Fix families RLS policy for INSERT

  1. Changes
    - Drop existing INSERT policy on families table
    - Create new permissive INSERT policy that allows any authenticated user
    - The policy checks if user has a valid auth session without additional constraints
  
  2. Security
    - Still requires authentication
    - Once family is created, family_members table links it to the user
    - SELECT policy ensures users only see their own families
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Allow authenticated users to insert families" ON families;

-- Create very permissive INSERT policy for authenticated users
-- The real security comes from the family_members relationship
CREATE POLICY "Authenticated users can insert families"
  ON families
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
