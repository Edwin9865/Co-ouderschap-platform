/*
  # Trigger: auto-grant child_visibility when a HELPER is added to family_members

  ## Problem
  child_visibility records are never created when a helper is coupled via the
  koppelcode flow (direct insert into family_members). The frontend upsert is
  unreliable and errors are silently swallowed.

  ## Fix
  Add a SECURITY DEFINER trigger on family_members that fires after INSERT (or
  UPDATE to ACTIVE) of a HELPER row, and inserts child_visibility for all active
  children in that family. This covers ALL code paths:
    - koppelcode (direct family_members insert)
    - helper_requests approval (via handle_helper_request_approval trigger)
    - any future path
*/

CREATE OR REPLACE FUNCTION public.grant_child_visibility_to_new_helper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when a HELPER becomes ACTIVE
  IF NEW.role = 'HELPER' AND NEW.status = 'ACTIVE'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ACTIVE')
  THEN
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    SELECT
      c.id,
      NEW.user_id,
      NEW.user_id   -- granted_by: best-effort; no auth context in trigger
    FROM children c
    WHERE c.family_id  = NEW.family_id
      AND c.deleted_at IS NULL
    ON CONFLICT (child_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_visibility_to_helper ON family_members;
CREATE TRIGGER trg_grant_visibility_to_helper
  AFTER INSERT OR UPDATE OF status ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_child_visibility_to_new_helper();
