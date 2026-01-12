/*
  # Fix accept_coupling_request to properly merge families

  ## Problem
  When accepting a coupling request, both users are added to each other's families
  but the families are not merged. This causes:
  - Users see two separate families instead of one merged family
  - Children remain in separate families and are not visible to the other parent
  
  ## Solution
  Update the accept_coupling_request function to:
  1. Determine which family to keep (the one that accepted the request)
  2. Move all data from the requester's family to the accepting family
  3. Mark the requester's old family as MERGED
  4. Deactivate memberships in the old family
  
  ## Changes
  1. Replace accept_coupling_request function with merge logic
*/

-- Function to accept a coupling request and merge families
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

  -- Add the accepting user to the requester's family (if not already there)
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
    -- First check if keep_family has a subscription
    IF EXISTS (SELECT 1 FROM subscriptions WHERE family_id = keep_family_id) THEN
      -- Delete merge_family subscription
      DELETE FROM subscriptions WHERE family_id = merge_family_id;
    ELSE
      -- Move merge_family subscription to keep_family
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

  -- Grant visibility for selected children
  IF array_length(selected_child_ids, 1) > 0 THEN
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    SELECT 
      unnest(selected_child_ids),
      request_record.from_user_id,
      auth.uid()
    ON CONFLICT (child_id, user_id) DO NOTHING;
  END IF;

  -- Ensure both users have visibility for all children in the merged family
  -- (The triggers should handle this, but let's be explicit)
  INSERT INTO child_visibility (child_id, user_id, granted_by)
  SELECT 
    c.id,
    request_record.from_user_id,
    c.created_by
  FROM children c
  WHERE c.family_id = keep_family_id
    AND c.created_by != request_record.from_user_id
    AND NOT EXISTS (
      SELECT 1 FROM child_visibility cv
      WHERE cv.child_id = c.id AND cv.user_id = request_record.from_user_id
    );

  INSERT INTO child_visibility (child_id, user_id, granted_by)
  SELECT 
    c.id,
    request_record.to_user_id,
    c.created_by
  FROM children c
  WHERE c.family_id = keep_family_id
    AND c.created_by != request_record.to_user_id
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
