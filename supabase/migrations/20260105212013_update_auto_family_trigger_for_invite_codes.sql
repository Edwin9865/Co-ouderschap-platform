/*
  # Update auto-create family trigger for invite codes

  ## Overview
  Modify the auto-create family trigger to only create a family if the user
  is not already a member of any family (via invite code).

  ## Changes
  1. Update trigger function to check for existing family memberships
  2. Only create family + subscription if user has no family yet
*/

-- Update the auto-create family function
CREATE OR REPLACE FUNCTION auto_create_family_for_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_family_id uuid;
  existing_membership_count integer;
BEGIN
  -- Check if user already has a family membership
  SELECT COUNT(*) INTO existing_membership_count
  FROM family_members
  WHERE user_id = NEW.id;

  -- Only create family if user has no memberships yet
  IF existing_membership_count = 0 THEN
    -- Create a family for the new user
    INSERT INTO families (name)
    VALUES (NEW.name || ' gezin')
    RETURNING id INTO new_family_id;

    -- Add user as PARENT to the family
    INSERT INTO family_members (family_id, user_id, role, status)
    VALUES (new_family_id, NEW.id, 'PARENT', 'ACTIVE');

    -- Create FREE subscription
    INSERT INTO subscriptions (family_id, plan, status)
    VALUES (new_family_id, 'FREE', 'ACTIVE');
  END IF;

  RETURN NEW;
END;
$$;
