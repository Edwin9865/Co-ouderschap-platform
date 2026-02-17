/*
  # Backfill Existing Visibility History
  
  ## Purpose
  Create historical records for all currently active child_visibility grants.
  This ensures existing users get proper export filtering.
  
  ## Changes
  1. Insert records for all active visibility grants
  2. Set granted_at to the created_at from child_visibility
  3. Leave revoked_at NULL (still active)
  
  ## Safety
  - Uses ON CONFLICT DO NOTHING to prevent duplicates
  - Idempotent - can be run multiple times safely
*/

-- Insert historical records for all currently active visibility grants
INSERT INTO child_visibility_history (
  child_id,
  user_id,
  granted_by,
  granted_at,
  revoked_at,
  revoked_by,
  revoke_reason,
  created_at
)
SELECT 
  cv.child_id,
  cv.user_id,
  cv.granted_by,
  cv.created_at as granted_at,
  NULL as revoked_at, -- Still active
  NULL as revoked_by,
  NULL as revoke_reason,
  cv.created_at
FROM child_visibility cv
ON CONFLICT DO NOTHING;

-- Also create visibility history for children creators (they always have access)
INSERT INTO child_visibility_history (
  child_id,
  user_id,
  granted_by,
  granted_at,
  revoked_at,
  revoked_by,
  revoke_reason,
  created_at
)
SELECT 
  c.id as child_id,
  c.created_by as user_id,
  c.created_by as granted_by,
  c.created_at as granted_at,
  c.deleted_at as revoked_at, -- If deleted, close the period
  c.deleted_by as revoked_by,
  CASE 
    WHEN c.deleted_at IS NOT NULL THEN 'CHILD_DELETED'::text
    ELSE NULL
  END as revoke_reason,
  c.created_at as created_at
FROM children c
WHERE c.created_by IS NOT NULL
  -- Only insert if no record exists yet
  AND NOT EXISTS (
    SELECT 1 
    FROM child_visibility_history cvh
    WHERE cvh.child_id = c.id 
      AND cvh.user_id = c.created_by
  )
ON CONFLICT DO NOTHING;
