/*
  # Migrate existing children to new visibility system

  ## Problem
  Existing children don't have visibility records, so they won't be visible
  to any parents under the new system.

  ## Solution
  Grant visibility to all active parents in each child's family.

  ## Changes
  1. Insert visibility records for all existing children
  2. Grant access to all active parents in the family
*/

-- Grant visibility to all existing children for all active parents in their families
INSERT INTO child_visibility (child_id, user_id, granted_by)
SELECT DISTINCT
  c.id as child_id,
  fm.user_id,
  fm.user_id as granted_by  -- Self-granted for existing children
FROM children c
JOIN family_members fm ON fm.family_id = c.family_id
WHERE fm.status = 'ACTIVE'
  AND fm.role = 'PARENT'
ON CONFLICT (child_id, user_id) DO NOTHING;