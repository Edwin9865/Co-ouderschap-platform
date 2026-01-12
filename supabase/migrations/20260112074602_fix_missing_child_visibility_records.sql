/*
  # Fix missing child visibility records
  
  ## Problem
  Some children don't have visibility records for all parents in their family.
  This causes parents not to see each other's children after coupling.
  
  ## Solution
  Re-run the backfill to ensure all children have visibility for all parents
  in their family (except the creator).
  
  ## Changes
  1. Delete and recreate all child_visibility records to ensure consistency
*/

-- First, clean up and recreate all visibility records
-- This ensures consistency after coupling

DELETE FROM child_visibility;

-- Grant visibility for all children to all parents in their family
-- (except the creator, who has implicit access)
INSERT INTO child_visibility (child_id, user_id, granted_by)
SELECT DISTINCT
  c.id as child_id,
  fm.user_id,
  c.created_by as granted_by
FROM children c
INNER JOIN family_members fm 
  ON fm.family_id = c.family_id
WHERE fm.role = 'PARENT'
  AND fm.status = 'ACTIVE'
  AND fm.user_id != c.created_by
ON CONFLICT (child_id, user_id) DO NOTHING;
