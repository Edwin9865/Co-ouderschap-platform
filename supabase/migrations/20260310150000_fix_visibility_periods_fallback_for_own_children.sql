/*
  # Fix: get_visibility_periods fallback for own children without history

  ## Problem
  `get_visibility_periods` returns an empty result when a creator has no
  `child_visibility_history` entry for their own (possibly deleted) child.
  The edge function then calls `.some()` on an empty array → `false` →
  all events/logs for that child are filtered out.

  The code-side fix (`if (periods.length === 0) return true`) covers this,
  but the DB function should also be correct for any future callers.

  ## Fix
  Add a UNION fallback that synthesises a period from the child's own
  `created_at` / `deleted_at` when no real history row exists.
*/

CREATE OR REPLACE FUNCTION get_visibility_periods(
  check_child_id uuid,
  check_user_id uuid
)
RETURNS TABLE (
  granted_at    timestamptz,
  revoked_at    timestamptz,
  is_active     boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  -- Real history rows (may be empty for own children created before history system)
  SELECT
    cvh.granted_at,
    cvh.revoked_at,
    (cvh.revoked_at IS NULL) AS is_active
  FROM child_visibility_history cvh
  WHERE cvh.child_id = check_child_id
    AND cvh.user_id  = check_user_id

  UNION ALL

  -- Synthesised fallback: only when no real history entry exists
  SELECT
    c.created_at  AS granted_at,
    c.deleted_at  AS revoked_at,
    (c.deleted_at IS NULL) AS is_active
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
  'Get all visibility periods for a user/child combination, with fallback for own children without history';
