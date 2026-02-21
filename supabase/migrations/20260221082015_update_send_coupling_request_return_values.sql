/*
  # Update send_coupling_request to return target IDs

  Updates the send_coupling_request function to return target_family_id 
  and target_user_id so the frontend can send notifications.

  ## Changes
  - Adds target_family_id to return value
  - Adds target_user_id to return value
*/

CREATE OR REPLACE FUNCTION send_coupling_request(
  invite_code_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_family_id uuid;
  target_family_id uuid;
  target_user_id uuid;
  target_user_name text;
  existing_request_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Niet geauthenticeerd'
    );
  END IF;
  
  -- Get current user's family
  SELECT family_id INTO current_family_id
  FROM family_members
  WHERE user_id = current_user_id
    AND role = 'PARENT'
    AND status = 'ACTIVE'
  LIMIT 1;
  
  IF current_family_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Je bent geen lid van een gezin'
    );
  END IF;
  
  -- Validate invite code
  SELECT family_id INTO target_family_id
  FROM family_invite_codes
  WHERE code = invite_code_param
    AND used_at IS NULL;
  
  IF target_family_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Koppelcode niet gevonden'
    );
  END IF;
  
  -- Check if it's their own code
  IF target_family_id = current_family_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Dit is je eigen koppelcode'
    );
  END IF;
  
  -- Find a parent in the target family
  SELECT fm.user_id, u.name INTO target_user_id, target_user_name
  FROM family_members fm
  JOIN users u ON u.id = fm.user_id
  WHERE fm.family_id = target_family_id
    AND fm.role = 'PARENT'
    AND fm.status = 'ACTIVE'
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Geen ouder gevonden in het doelgezin'
    );
  END IF;
  
  -- Check for existing pending request
  SELECT id INTO existing_request_id
  FROM coupling_requests
  WHERE from_user_id = current_user_id
    AND to_user_id = target_user_id
    AND status = 'PENDING';
  
  IF existing_request_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Je hebt al een actief verzoek naar deze ouder'
    );
  END IF;
  
  -- Create coupling request
  INSERT INTO coupling_requests (
    from_user_id,
    to_user_id,
    from_family_id,
    to_family_id,
    status
  ) VALUES (
    current_user_id,
    target_user_id,
    current_family_id,
    target_family_id,
    'PENDING'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'target_user_name', target_user_name,
    'target_family_id', target_family_id,
    'target_user_id', target_user_id
  );
END;
$$;