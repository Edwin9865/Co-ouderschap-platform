/*
  # Fix Child Visibility Enforcement

  ## Problems

  ### 1. Auto-grant trigger overrides user choice
  The trigger `auto_grant_visibility_on_family_join_trigger` automatically grants
  visibility for ALL children to any parent who joins/is updated in a family.
  This fires during `accept_coupling_request` and silently overrides the user's
  selective sharing choice from the coupling UI.

  ### 2. accept_coupling_request force-grants all children
  Lines in `accept_coupling_request` explicitly insert visibility for ALL children
  in the merged family to the requester, ignoring the `selected_child_ids` parameter
  that the accepting user chose in the UI.

  ### 3. No realtime propagation (handled in FamilyContext.tsx)
  When visibility is revoked, the other parent's client does not refresh because
  there was no subscription on the `child_visibility` table.
  Fixed in FamilyContext.tsx by adding a realtime channel.

  ## Changes
  1. Drop the `auto_grant_visibility_on_family_join_trigger` trigger and its function
  2. Update `accept_coupling_request` to ONLY grant visibility for `selected_child_ids`
     (the accepting user's children shared with the requester) and auto-grant the
     requester's children to the accepting user (no UI exists for this direction yet)

  ## Impact
  - The accepting user's child selection during coupling is now respected
  - Post-coupling visibility toggles work correctly and propagate in realtime
  - child_visibility_history continues to track all access periods as before
*/

-- ============================================================================
-- 1. Remove the auto-grant trigger that bypasses user choice
-- ============================================================================

DROP TRIGGER IF EXISTS auto_grant_visibility_on_family_join_trigger ON family_members;
DROP FUNCTION IF EXISTS grant_visibility_for_existing_children();

-- ============================================================================
-- 2. Fix accept_coupling_request: respect selected_child_ids
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_coupling_request(
  request_id uuid,
  selected_child_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record coupling_requests;
  from_family_member_count int;
  to_family_member_count int;
  keep_family_id uuid;
  merge_family_id uuid;
  result jsonb;
BEGIN
  -- Get the coupling request
  SELECT * INTO request_record
  FROM coupling_requests
  WHERE id = request_id
    AND to_user_id = auth.uid()
    AND status = 'PENDING';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Count active members in each family
  SELECT COUNT(*) INTO from_family_member_count
  FROM family_members
  WHERE family_id = request_record.from_family_id
    AND status = 'ACTIVE';

  SELECT COUNT(*) INTO to_family_member_count
  FROM family_members
  WHERE family_id = request_record.to_family_id
    AND status = 'ACTIVE';

  -- Keep the family with more members, or the accepting user's family if equal
  IF from_family_member_count > to_family_member_count THEN
    keep_family_id := request_record.from_family_id;
    merge_family_id := request_record.to_family_id;
  ELSE
    keep_family_id := request_record.to_family_id;
    merge_family_id := request_record.from_family_id;
  END IF;

  -- Update request status
  UPDATE coupling_requests
  SET status = 'ACCEPTED', updated_at = now()
  WHERE id = request_id;

  -- Add the requester to the accepting family (if not already there)
  INSERT INTO family_members (family_id, user_id, role, status)
  VALUES (keep_family_id, request_record.from_user_id, 'PARENT', 'ACTIVE')
  ON CONFLICT (family_id, user_id) DO UPDATE
  SET status = 'ACTIVE', role = 'PARENT';

  -- Add the accepting user to the keep family (if not already there)
  INSERT INTO family_members (family_id, user_id, role, status)
  VALUES (keep_family_id, request_record.to_user_id, 'PARENT', 'ACTIVE')
  ON CONFLICT (family_id, user_id) DO UPDATE
  SET status = 'ACTIVE', role = 'PARENT';

  -- Move all children from merge_family to keep_family
  UPDATE children
  SET family_id = keep_family_id
  WHERE family_id = merge_family_id;

  -- Move all events from merge_family to keep_family
  UPDATE events
  SET family_id = keep_family_id
  WHERE family_id = merge_family_id;

  -- Move all requests from merge_family to keep_family
  UPDATE requests
  SET family_id = keep_family_id
  WHERE family_id = merge_family_id;

  -- Move logs if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
    EXECUTE 'UPDATE logs SET family_id = $1 WHERE family_id = $2'
    USING keep_family_id, merge_family_id;
  END IF;

  -- Move questions if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
    EXECUTE 'UPDATE questions SET family_id = $1 WHERE family_id = $2'
    USING keep_family_id, merge_family_id;
  END IF;

  -- Move helper_messages if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'helper_messages') THEN
    EXECUTE 'UPDATE helper_messages SET family_id = $1 WHERE family_id = $2'
    USING keep_family_id, merge_family_id;
  END IF;

  -- Move subscriptions if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    -- Keep the best subscription (PRO > PLUS > FREE)
    IF EXISTS (SELECT 1 FROM subscriptions WHERE family_id = keep_family_id) THEN
      DELETE FROM subscriptions WHERE family_id = merge_family_id;
    ELSE
      UPDATE subscriptions SET family_id = keep_family_id WHERE family_id = merge_family_id;
    END IF;
  END IF;

  -- Mark the merged family as MERGED
  UPDATE families
  SET status = 'MERGED'
  WHERE id = merge_family_id;

  -- Deactivate all memberships in the merged family
  UPDATE family_members
  SET status = 'INACTIVE'
  WHERE family_id = merge_family_id;

  -- Grant visibility for explicitly selected children (accepting user's children → requester)
  -- This respects the user's choice in the coupling UI
  IF array_length(selected_child_ids, 1) > 0 THEN
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    SELECT
      unnest(selected_child_ids),
      request_record.from_user_id,
      auth.uid()
    ON CONFLICT (child_id, user_id) DO NOTHING;
  END IF;

  -- Auto-grant the requester's children to the accepting user
  -- (no UI exists for the requester to choose which of their children to share)
  INSERT INTO child_visibility (child_id, user_id, granted_by)
  SELECT
    c.id,
    request_record.to_user_id,
    c.created_by
  FROM children c
  WHERE c.family_id = keep_family_id
    AND c.created_by = request_record.from_user_id
    AND NOT EXISTS (
      SELECT 1 FROM child_visibility cv
      WHERE cv.child_id = c.id AND cv.user_id = request_record.to_user_id
    );

  RETURN jsonb_build_object(
    'success', true,
    'family_id', keep_family_id
  );
END;
$$;
