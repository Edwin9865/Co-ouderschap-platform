/*
  # Historical Visibility Tracking System
  
  ## Purpose
  Fix export bug where disconnected co-parents can see data created after disconnection.
  Implement manipulatie-bestendige complete dossiervorming.

  ## Changes
  
  1. **Soft Delete for Children**
     - Add deleted_at and deleted_by columns
     - Kinderen worden niet meer hard deleted
  
  2. **child_visibility_history Table**
     - Track WHEN visibility was granted and revoked
     - Track WHO revoked it and WHY
     - Enables time-based data filtering
  
  3. **Indexes**
     - Optimize historical queries
     - Support export performance
  
  ## Security
  - No RLS changes on existing tables
  - History table is append-only
  - Export function will use history for filtering
*/

-- Step 1: Enable btree_gist extension for range constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Add soft delete columns to children table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE children 
    ADD COLUMN deleted_at timestamptz,
    ADD COLUMN deleted_by uuid REFERENCES users(id);
    
    COMMENT ON COLUMN children.deleted_at IS 'Soft delete timestamp - when child was marked as deleted';
    COMMENT ON COLUMN children.deleted_by IS 'User who soft-deleted this child';
  END IF;
END $$;

-- Step 3: Create child_visibility_history table
CREATE TABLE IF NOT EXISTS child_visibility_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES users(id),
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id),
  revoke_reason text CHECK (revoke_reason IN ('MANUAL_REVOKE', 'CHILD_DELETED', 'VISIBILITY_REMOVED', 'UNCOUPLING', 'FAMILY_MERGE')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure no overlapping active periods
  CONSTRAINT no_overlapping_periods EXCLUDE USING gist (
    child_id WITH =,
    user_id WITH =,
    tstzrange(granted_at, COALESCE(revoked_at, 'infinity'::timestamptz), '[)') WITH &&
  )
);

COMMENT ON TABLE child_visibility_history IS 'Historical record of when users had access to children - for audit trail and exports';
COMMENT ON COLUMN child_visibility_history.granted_at IS 'When visibility was granted (ISO 8601)';
COMMENT ON COLUMN child_visibility_history.revoked_at IS 'When visibility was revoked (ISO 8601), NULL if still active';
COMMENT ON COLUMN child_visibility_history.revoke_reason IS 'Why visibility was revoked - for audit trail';

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_child_visibility_history_user_child 
  ON child_visibility_history(user_id, child_id);

CREATE INDEX IF NOT EXISTS idx_child_visibility_history_child 
  ON child_visibility_history(child_id);

CREATE INDEX IF NOT EXISTS idx_child_visibility_history_periods 
  ON child_visibility_history(granted_at, revoked_at) 
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_child_visibility_history_user_active
  ON child_visibility_history(user_id)
  WHERE revoked_at IS NULL;

-- Step 5: Enable RLS on history table
ALTER TABLE child_visibility_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own visibility history
CREATE POLICY "Users can view own visibility history"
  ON child_visibility_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR granted_by = auth.uid() OR revoked_by = auth.uid());

-- Only system can insert (via triggers)
CREATE POLICY "System can insert visibility history"
  ON child_visibility_history
  FOR INSERT
  TO authenticated
  WITH CHECK (granted_by = auth.uid());

-- No updates or deletes - append-only audit trail
CREATE POLICY "No updates on history"
  ON child_visibility_history
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No deletes on history"
  ON child_visibility_history
  FOR DELETE
  TO authenticated
  USING (false);
