/*
  # Fix: get_visibility_periods — fallback for own children without history + revoke_reason

  ## Problem
  1. `get_visibility_periods` returns empty for creator's own child when no
     `child_visibility_history` entry exists (can happen for children created before
     the history system, or when the auto-grant trigger fired without auth context).
     The edge-function then shows "Eigen kind (altijd toegang)" instead of actual dates.

  2. The function did not return `revoke_reason`, so the HTML template could not show
     the reason for revocation (e.g. "CHILD_DELETED").

  ## Fix
  - Add `revoke_reason` to the return type.
  - Add a UNION fallback that synthesises a period from `children.created_at` /
    `children.deleted_at` when no real history row exists for the creator.
*/

DROP FUNCTION IF EXISTS get_visibility_periods(uuid, uuid);

CREATE OR REPLACE FUNCTION get_visibility_periods(
  check_child_id uuid,
  check_user_id uuid
)
RETURNS TABLE (
  granted_at    timestamptz,
  revoked_at    timestamptz,
  revoke_reason text,
  is_active     boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  -- Real history rows
  SELECT
    cvh.granted_at,
    cvh.revoked_at,
    cvh.revoke_reason,
    (cvh.revoked_at IS NULL) AS is_active
  FROM child_visibility_history cvh
  WHERE cvh.child_id = check_child_id
    AND cvh.user_id  = check_user_id

  UNION ALL

  -- Synthesised fallback: only when no real history entry exists for this creator
  SELECT
    c.created_at                                               AS granted_at,
    c.deleted_at                                               AS revoked_at,
    CASE WHEN c.deleted_at IS NOT NULL THEN 'CHILD_DELETED' END AS revoke_reason,
    (c.deleted_at IS NULL)                                     AS is_active
  FROM children c
  WHERE c.id         = check_child_id
    AND c.created_by = check_user_id
    AND NOT EXISTS (
      SELECT 1
      FROM child_visibility_history cvh2
      WHERE cvh2.child_id = check_child_id
        AND cvh2.user_id  = check_user_id
    )

  ORDER BY granted_at DESC;
$$;

COMMENT ON FUNCTION get_visibility_periods IS
  'Get all visibility periods (including revoke_reason) for a user/child combination, with fallback for own children without history';
