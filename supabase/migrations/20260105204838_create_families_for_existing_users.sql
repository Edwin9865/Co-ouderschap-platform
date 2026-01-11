/*
  # Create families for existing users

  ## Overview
  For any users that already exist in the database without a family,
  create a family, add them as PARENT, and create a subscription.

  ## Changes
  1. For each user without a family membership
  2. Create a family
  3. Add them as PARENT
  4. Create FREE subscription
*/

DO $$
DECLARE
  user_record RECORD;
  new_family_id uuid;
BEGIN
  -- Loop through users who don't have any family memberships
  FOR user_record IN 
    SELECT u.id, u.name
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.user_id = u.id
    )
  LOOP
    -- Create family
    INSERT INTO families (name)
    VALUES (user_record.name || ' gezin')
    RETURNING id INTO new_family_id;

    -- Add user as PARENT
    INSERT INTO family_members (family_id, user_id, role, status)
    VALUES (new_family_id, user_record.id, 'PARENT', 'ACTIVE');

    -- Create subscription
    INSERT INTO subscriptions (family_id, plan, status)
    VALUES (new_family_id, 'FREE', 'ACTIVE');
  END LOOP;
END $$;
