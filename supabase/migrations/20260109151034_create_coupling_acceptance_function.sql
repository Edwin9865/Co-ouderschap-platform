/*
  # Create function to handle coupling request acceptance

  ## Overview
  When a coupling request is accepted, we need to:
  1. Add the requesting user to the recipient's family
  2. Add the recipient user to the requesting user's family
  3. Mark the request as ACCEPTED
  4. NOT automatically merge families or children (user will choose per child)

  ## Changes
  1. Create accept_coupling_request function
  2. This replaces the automatic merge behavior
*/

-- Function to accept a coupling request
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

  -- Update request status
  UPDATE coupling_requests
  SET status = 'ACCEPTED', updated_at = now()
  WHERE id = request_id;

  -- Add requesting user to recipient's family
  INSERT INTO family_members (family_id, user_id, role, status)
  VALUES (request_record.to_family_id, request_record.from_user_id, 'PARENT', 'ACTIVE')
  ON CONFLICT (family_id, user_id) DO UPDATE
  SET status = 'ACTIVE', role = 'PARENT';

  -- Add recipient user to requesting user's family  
  INSERT INTO family_members (family_id, user_id, role, status)
  VALUES (request_record.from_family_id, request_record.to_user_id, 'PARENT', 'ACTIVE')
  ON CONFLICT (family_id, user_id) DO UPDATE
  SET status = 'ACTIVE', role = 'PARENT';

  -- Grant visibility for selected children (from recipient to requester)
  IF array_length(selected_child_ids, 1) > 0 THEN
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    SELECT 
      unnest(selected_child_ids),
      request_record.from_user_id,
      auth.uid()
    ON CONFLICT (child_id, user_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'from_family_id', request_record.from_family_id,
    'to_family_id', request_record.to_family_id
  );
END;
$$;