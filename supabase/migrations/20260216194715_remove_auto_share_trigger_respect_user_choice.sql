/*
  # Remove Auto-Share Trigger - Respect User Privacy Choice

  ## Problem
  The trigger `grant_child_visibility_to_family_parents()` automatically shares
  ALL children with ALL parents in the family, completely ignoring the user's
  explicit "share with co-parent(s)" checkbox choice during child creation.

  This is a CRITICAL PRIVACY BUG that prevents users from controlling which
  children are visible to their co-parents.

  ## Business Impact
  - Users cannot keep children private
  - "Share with co-parent(s)" checkbox is completely non-functional
  - Privacy expectations are violated
  - Trust in the application is compromised

  ## Solution
  Remove the automatic trigger and rely on the frontend code which already
  correctly implements the sharing logic based on user choice:
  
  Frontend code (Children.tsx line 100-108):
  ```
  if (shareWithCoParents && newChild && coParents.length > 0) {
    await supabase.from('child_visibility').insert(
      coParents.map((parent) => ({
        child_id: newChild.id,
        user_id: parent.user_id,
        granted_by: user.id,
      }))
    );
  }
  ```

  ## Changes
  1. Drop the trigger
  2. Drop the trigger function
  3. User choice is now respected
*/

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS auto_grant_child_visibility_trigger ON children;

-- Drop the trigger function
DROP FUNCTION IF EXISTS grant_child_visibility_to_family_parents();

-- Note: Existing child_visibility records remain intact.
-- Users can manually adjust visibility using the UI after this migration.
