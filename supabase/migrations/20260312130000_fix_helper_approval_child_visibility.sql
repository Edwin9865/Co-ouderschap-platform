/*
  # Fix: grant child_visibility to helper on request approval

  ## Problem
  When a helper request is approved, `handle_helper_request_approval()` adds the
  helper to `family_members` but never inserts rows into `child_visibility`.
  Because the RLS policies and FamilyContext both require an explicit child_visibility
  entry, the helper ends up seeing an empty children list — and therefore also an
  empty agenda and logbook (both filtered by visible children).
  Only requests (verzoeken) are visible because their RLS policy allows family-wide
  access without child_visibility.

  ## Fix
  After inserting the helper into family_members, also grant child_visibility for
  every active (non-deleted) child in that family.
  Future children added to the family will need a separate grant mechanism, but this
  covers the normal onboarding flow.
*/

CREATE OR REPLACE FUNCTION handle_helper_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if status changed to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN

    -- Add helper to family_members if not already a member
    INSERT INTO family_members (family_id, user_id, role, status)
    VALUES (NEW.family_id, NEW.helper_id, 'HELPER', 'ACTIVE')
    ON CONFLICT (family_id, user_id) DO NOTHING;

    -- Grant child_visibility for all active children in this family
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    SELECT
      c.id,
      NEW.helper_id,
      auth.uid()
    FROM children c
    WHERE c.family_id  = NEW.family_id
      AND c.deleted_at IS NULL
    ON CONFLICT (child_id, user_id) DO NOTHING;

    -- Set responded_at and responded_by
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  END IF;

  -- If rejected, set responded_at and responded_by
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;
