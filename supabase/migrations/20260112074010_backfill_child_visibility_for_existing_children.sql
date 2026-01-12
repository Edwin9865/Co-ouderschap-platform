/*
  # Backfill child visibility for existing children
  
  ## Problem
  Existing children don't have visibility entries for all parents in their family.
  
  ## Solution
  Grant visibility for all existing children to all ACTIVE PARENT members 
  in their respective families.
  
  ## Changes
  1. Insert child_visibility entries for all existing children and parents
*/

-- Grant visibility for all existing children to all parents in their family
INSERT INTO child_visibility (child_id, user_id, granted_by)
SELECT DISTINCT
  c.id,
  fm.user_id,
  c.created_by
FROM children c
INNER JOIN family_members fm 
  ON fm.family_id = c.family_id
WHERE fm.role = 'PARENT'
  AND fm.status = 'ACTIVE'
  AND fm.user_id != c.created_by
ON CONFLICT (child_id, user_id) DO NOTHING;
