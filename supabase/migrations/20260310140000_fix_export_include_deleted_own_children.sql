/*
  # Fix: include deleted own children in export

  ## Problem
  `get_accessible_children_for_export` uses INNER JOIN on `child_visibility_history`,
  so a creator whose child has no history entry (e.g. child created before the history
  system, or when the auto-grant trigger fired without auth context) will not see the
  deleted child in the export.

  ## Fix
  Replace the INNER JOIN with a LEFT JOIN and add an OR condition so the creator's own
  children always appear — whether or not a `child_visibility_history` entry exists.
  Also ensure visibility periods are synthesised from `children.created_at`/`deleted_at`
  when no history row exists, so the edge-function filtering works correctly.
*/

CREATE OR REPLACE FUNCTION get_accessible_children_for_export(
  check_user_id uuid,
  check_family_id uuid
)
RETURNS TABLE (
  child_id uuid,
  first_name text,
  birth_year int,
  color text,
  created_at timestamptz,
  deleted_at timestamptz,
  earliest_access timestamptz,
  latest_revoke timestamptz,
  is_currently_accessible boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  WITH user_child_access AS (
    SELECT DISTINCT
      cvh.child_id,
      MIN(cvh.granted_at)  AS earliest_access,
      MAX(cvh.revoked_at)  AS latest_revoke,
      bool_or(cvh.revoked_at IS NULL) AS is_currently_accessible
    FROM child_visibility_history cvh
    WHERE cvh.user_id = check_user_id
    GROUP BY cvh.child_id
  )
  SELECT
    c.id                    AS child_id,
    c.first_name,
    c.birth_year,
    c.color,
    c.created_at,
    c.deleted_at,
    -- If no history entry exists, fall back to the child's own timestamps
    COALESCE(uca.earliest_access,   c.created_at)                               AS earliest_access,
    COALESCE(uca.latest_revoke,     c.deleted_at)                               AS latest_revoke,
    COALESCE(uca.is_currently_accessible, c.deleted_at IS NULL)                 AS is_currently_accessible
  FROM children c
  LEFT JOIN user_child_access uca ON uca.child_id = c.id
  WHERE c.family_id = check_family_id
    AND (
      -- Has visibility history (own child or co-parent child ever shared)
      uca.child_id IS NOT NULL
      OR
      -- No history entry but IS the creator — always include (own deleted child)
      c.created_by = check_user_id
    )
  ORDER BY c.first_name;
$$;

COMMENT ON FUNCTION get_accessible_children_for_export IS
  'Get all children (current + historical + own deleted) accessible to user for export';
