/*
  # Fix family creation chicken-and-egg problem

  ## Problem
  When creating a new family:
  1. User creates family (works - policy allows it)
  2. User tries to add themselves as family_member (FAILS - needs to be parent already)
  3. User tries to create subscription (FAILS - needs to be parent already)

  This is a chicken-and-egg problem where you need to be a parent to add yourself as a parent.

  ## Solution
  Update INSERT policies to allow:
  1. Adding family_members to newly created families (within 1 minute)
  2. Creating subscriptions for newly created families (within 1 minute)

  ## Changes
  1. Update family_members INSERT policy
  2. Update subscriptions INSERT policy
*/

-- ============================================================================
-- FIX FAMILY_MEMBERS INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Parents can manage family members" ON family_members;

-- Allow adding members to families where user is parent OR family was just created
CREATE POLICY "Parents can manage family members"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_family_parent(family_id)
    OR 
    -- Allow adding yourself as first member to a newly created family
    (
      user_id = auth.uid()
      AND role = 'PARENT'
      AND EXISTS (
        SELECT 1 FROM families
        WHERE families.id = family_members.family_id
        AND families.created_at > (now() - interval '1 minute')
      )
    )
  );

-- ============================================================================
-- FIX SUBSCRIPTIONS INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create subscriptions for their families" ON subscriptions;

-- Allow creating subscription if parent OR for newly created families
CREATE POLICY "Authenticated users can create subscriptions for their families"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Standard check: user is parent
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = subscriptions.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'PARENT'
      AND family_members.status = 'ACTIVE'
    )
    OR
    -- Allow for newly created families (within 1 minute)
    EXISTS (
      SELECT 1 FROM families
      WHERE families.id = subscriptions.family_id
      AND families.created_at > (now() - interval '1 minute')
    )
  );