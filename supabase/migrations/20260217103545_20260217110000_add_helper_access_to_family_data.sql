/*
  # Add helper access to family data

  ## Problem
  Helpers (hulpverleners) are added to families via family_members with role='HELPER',
  but current RLS policies only allow role='PARENT' to view children, events, and log entries.
  This means helpers cannot see any family data even though they are members.

  ## Solution
  Update RLS policies to allow both PARENT and HELPER roles to view family data.
  
  ## Changes
  1. Update children SELECT policy to include helpers
  2. Update events SELECT policy to include helpers
  3. Update log_entries SELECT policy to include helpers
  4. Update requests SELECT policy to include helpers
  
  ## Notes
  - Helpers remain read-only (no INSERT/UPDATE/DELETE)
  - Only affects SELECT policies
  - Maintains same family_id and status checks
*/

-- ============================================================================
-- CHILDREN: Allow helpers to view children
-- ============================================================================
DROP POLICY IF EXISTS "Parents can view children in their families" ON children;

CREATE POLICY "Family members can view children"
  ON children FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = children.family_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('PARENT', 'HELPER')
      AND fm.status = 'ACTIVE'
    )
  );

-- ============================================================================
-- EVENTS: Allow helpers to view events
-- ============================================================================
DROP POLICY IF EXISTS "Parents can view events" ON events;

CREATE POLICY "Family members can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = events.family_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('PARENT', 'HELPER')
      AND fm.status = 'ACTIVE'
    )
  );

-- ============================================================================
-- LOG ENTRIES: Allow helpers to view log entries
-- ============================================================================
DROP POLICY IF EXISTS "Parents can view log entries" ON log_entries;

CREATE POLICY "Family members can view log entries"
  ON log_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = log_entries.family_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('PARENT', 'HELPER')
      AND fm.status = 'ACTIVE'
    )
  );

-- ============================================================================
-- REQUESTS: Allow helpers to view requests
-- ============================================================================
DROP POLICY IF EXISTS "Parents can view requests" ON requests;

CREATE POLICY "Family members can view requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = requests.family_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('PARENT', 'HELPER')
      AND fm.status = 'ACTIVE'
    )
  );
