/*
  # Fix RLS Insert Policies

  ## Problem
  - Users cannot register because INSERT policy on users table is missing
  - Users cannot create families because INSERT policy requires authentication first
  
  ## Solution
  - Add INSERT policy for users table that allows new users to create their own record
  - Fix INSERT policy for families table to work with authenticated users
  
  ## Changes
  1. Add INSERT policy for users table
  2. Ensure families INSERT policy works correctly
*/

-- ============================================================================
-- FIX USERS INSERT POLICY
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Allow authenticated users to insert their own user record
-- This is needed during registration when Supabase Auth creates the user
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFY FAMILIES INSERT POLICY EXISTS
-- ============================================================================

-- The families INSERT policy already exists from previous migration
-- But let's ensure it works correctly
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;

CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- FIX SUBSCRIPTIONS INSERT POLICY
-- ============================================================================

-- Ensure subscriptions can be created
DROP POLICY IF EXISTS "Parents can manage subscriptions" ON subscriptions;

CREATE POLICY "Parents can manage subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (is_family_parent(family_id) OR family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid() 
    AND role = 'PARENT' 
    AND status = 'ACTIVE'
  ));

-- Also allow creating subscription for newly created families
-- This is a workaround for the chicken-egg problem
CREATE POLICY "Allow subscription creation for new families"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating a subscription right after creating a family
    EXISTS (
      SELECT 1 FROM families 
      WHERE families.id = subscriptions.family_id
      AND families.created_at > (now() - interval '1 minute')
    )
  );