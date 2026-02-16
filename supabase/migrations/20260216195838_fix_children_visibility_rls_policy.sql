/*
  # Fix Children Visibility RLS Policy

  ## Problem
  The SELECT policy on the children table includes `is_family_member(family_id)` which allows
  ALL family members to see ALL children, regardless of the child_visibility settings.
  This completely bypasses the "share with co-parent" checkbox functionality.

  ## Changes
  1. Drop existing SELECT policy on children table
  2. Create new SELECT policy that ONLY allows:
     - Creators to see their own children
     - Users with explicit child_visibility grants to see those children
     - REMOVES the is_family_member clause that was causing the bug

  ## Security
  - Maintains creator access (own children always visible)
  - Respects child_visibility table for granular sharing
  - Prevents unauthorized access to private children
  - Does not affect INSERT, UPDATE, or DELETE policies

  ## Impact
  - Users will now ONLY see children they created or have explicit visibility for
  - "Share with co-parent" checkbox will work correctly
  - Existing child_visibility records remain unchanged
  - No data loss - only viewing permissions affected
*/

-- Drop the buggy SELECT policy
DROP POLICY IF EXISTS "Users can view children in their families" ON children;

-- Create corrected SELECT policy that respects child_visibility settings
CREATE POLICY "Users can view their children or children shared with them"
  ON children
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR has_child_visibility(id, auth.uid())
  );
