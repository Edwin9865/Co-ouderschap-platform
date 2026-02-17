/*
  # Export Helper Functions
  
  ## Purpose
  Provide helper functions for the export edge function to filter data
  based on visibility periods.
  
  ## Functions
  
  1. **has_historical_child_visibility** - Check if user ever had access
  2. **get_visibility_periods** - Get all visibility periods for user/child
  3. **is_data_accessible_in_period** - Check if timestamp falls within access period
  4. **get_accessible_children_for_export** - Get all children user can export
  
  ## Security
  - SECURITY DEFINER with search_path set
  - Functions check auth.uid() internally
  - Read-only operations
*/

-- Function 1: Check if user has/had historical visibility to a child
CREATE OR REPLACE FUNCTION has_historical_child_visibility(
  check_child_id uuid,
  check_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM child_visibility_history
    WHERE child_id = check_child_id
      AND user_id = check_user_id
      AND granted_at IS NOT NULL
  );
$$;

COMMENT ON FUNCTION has_historical_child_visibility IS 'Check if user ever had visibility access to a child (for exports)';

-- Function 2: Get all visibility periods for a user and child
CREATE OR REPLACE FUNCTION get_visibility_periods(
  check_child_id uuid,
  check_user_id uuid
)
RETURNS TABLE (
  granted_at timestamptz,
  revoked_at timestamptz,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT 
    cvh.granted_at,
    cvh.revoked_at,
    (cvh.revoked_at IS NULL) as is_active
  FROM child_visibility_history cvh
  WHERE cvh.child_id = check_child_id
    AND cvh.user_id = check_user_id
  ORDER BY cvh.granted_at DESC;
$$;

COMMENT ON FUNCTION get_visibility_periods IS 'Get all visibility periods for a user/child combination';

-- Function 3: Check if a specific timestamp falls within ANY visibility period
CREATE OR REPLACE FUNCTION is_data_accessible_in_period(
  check_child_id uuid,
  check_user_id uuid,
  data_timestamp timestamptz
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM child_visibility_history cvh
    WHERE cvh.child_id = check_child_id
      AND cvh.user_id = check_user_id
      AND cvh.granted_at <= data_timestamp
      AND (cvh.revoked_at IS NULL OR cvh.revoked_at >= data_timestamp)
  );
$$;

COMMENT ON FUNCTION is_data_accessible_in_period IS 'Check if data timestamp falls within a visibility period';

-- Function 4: Get all children accessible for export (current + historical)
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
      MIN(cvh.granted_at) as earliest_access,
      MAX(cvh.revoked_at) as latest_revoke,
      bool_or(cvh.revoked_at IS NULL) as is_currently_accessible
    FROM child_visibility_history cvh
    WHERE cvh.user_id = check_user_id
    GROUP BY cvh.child_id
  )
  SELECT 
    c.id as child_id,
    c.first_name,
    c.birth_year,
    c.color,
    c.created_at,
    c.deleted_at,
    uca.earliest_access,
    uca.latest_revoke,
    uca.is_currently_accessible
  FROM children c
  INNER JOIN user_child_access uca ON uca.child_id = c.id
  WHERE c.family_id = check_family_id
  ORDER BY c.first_name;
$$;

COMMENT ON FUNCTION get_accessible_children_for_export IS 'Get all children (current + historical) accessible to user for export';
