/*
  # Visibility History Triggers
  
  ## Purpose
  Automatically log all visibility grants and revokes to child_visibility_history table.
  
  ## Triggers
  
  1. **log_child_visibility_grant** - When visibility is granted
  2. **log_child_visibility_revoke** - When visibility is removed  
  3. **log_child_soft_delete** - When child is soft-deleted
  
  ## Behavior
  - All triggers are AFTER triggers (don't block operations)
  - Automatically close visibility periods on revoke/delete
  - Track WHO and WHEN for audit trail
*/

-- Trigger 1: Log new visibility grants
CREATE OR REPLACE FUNCTION log_child_visibility_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert new visibility history record
  INSERT INTO child_visibility_history (
    child_id,
    user_id,
    granted_by,
    granted_at,
    revoked_at,
    revoked_by,
    revoke_reason
  ) VALUES (
    NEW.child_id,
    NEW.user_id,
    NEW.granted_by,
    NEW.created_at,
    NULL, -- Still active
    NULL,
    NULL
  )
  ON CONFLICT DO NOTHING; -- Prevent duplicates

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_child_visibility_grant ON child_visibility;

CREATE TRIGGER trg_child_visibility_grant
AFTER INSERT ON child_visibility
FOR EACH ROW
EXECUTE FUNCTION log_child_visibility_grant();

COMMENT ON FUNCTION log_child_visibility_grant() IS 'Automatically logs when child visibility is granted';

-- Trigger 2: Log visibility revokes (when row is deleted from child_visibility)
CREATE OR REPLACE FUNCTION log_child_visibility_revoke()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the most recent active visibility period
  UPDATE child_visibility_history
  SET 
    revoked_at = now(),
    revoked_by = auth.uid(),
    revoke_reason = 'MANUAL_REVOKE'
  WHERE child_id = OLD.child_id 
    AND user_id = OLD.user_id
    AND revoked_at IS NULL
    AND id = (
      SELECT id 
      FROM child_visibility_history
      WHERE child_id = OLD.child_id 
        AND user_id = OLD.user_id
        AND revoked_at IS NULL
      ORDER BY granted_at DESC
      LIMIT 1
    );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_child_visibility_revoke ON child_visibility;

CREATE TRIGGER trg_child_visibility_revoke
BEFORE DELETE ON child_visibility
FOR EACH ROW
EXECUTE FUNCTION log_child_visibility_revoke();

COMMENT ON FUNCTION log_child_visibility_revoke() IS 'Automatically logs when child visibility is revoked';

-- Trigger 3: Log child soft deletes
CREATE OR REPLACE FUNCTION log_child_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Close all open visibility periods for this child
  UPDATE child_visibility_history
  SET 
    revoked_at = NEW.deleted_at,
    revoked_by = NEW.deleted_by,
    revoke_reason = 'CHILD_DELETED'
  WHERE child_id = NEW.id 
    AND revoked_at IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_child_soft_delete ON children;

CREATE TRIGGER trg_child_soft_delete
AFTER UPDATE OF deleted_at ON children
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION log_child_soft_delete();

COMMENT ON FUNCTION log_child_soft_delete() IS 'Automatically closes visibility periods when child is soft-deleted';
