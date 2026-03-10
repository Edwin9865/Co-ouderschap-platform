/*
  # Fix "Family members can view children" policy

  ## Root Cause
  Migration 20260217103545 created a SELECT policy on children that allows ANY active
  family member (PARENT or HELPER) to see ALL children in the family, with NO check
  on child_visibility. Because PostgreSQL RLS combines permissive policies with OR,
  this single policy completely overrides all visibility controls — any family member
  sees every child regardless of child_visibility settings.

  ## Fix
  Replace the policy so family members can only see:
  1. Children they created themselves (creators always see their own children)
  2. Children explicitly shared with them via child_visibility

  ## Impact
  - Visibility toggles now work correctly for parents AND helpers
  - child_visibility_history audit trail continues to track access periods
*/

-- Drop the policy that bypasses visibility controls
DROP POLICY IF EXISTS "Family members can view children" ON children;

-- Recreate with visibility enforcement
CREATE POLICY "Family members can view children"
  ON children FOR SELECT
  TO authenticated
  USING (
    -- Must be an active member of this family
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = children.family_id
        AND fm.user_id = auth.uid()
        AND fm.role IN ('PARENT', 'HELPER')
        AND fm.status = 'ACTIVE'
    )
    AND (
      -- Creator always sees their own children
      created_by = auth.uid()
      OR
      -- Others only if explicitly shared
      has_child_visibility(id, auth.uid())
    )
  );
