/*
  # Auto-create family on user registration

  ## Overview
  Simplify the onboarding flow by automatically creating a family when a user registers.
  This eliminates the need for complex RLS policies and the family selection step.

  ## Changes
  1. Create trigger function to auto-create family
  2. Trigger runs after INSERT on users table
  3. Creates family named "[User's name] gezin"
  4. Adds user as PARENT to the family
  5. Creates FREE subscription for the family

  ## Security
  - Uses SECURITY DEFINER to bypass RLS during setup
  - All subsequent operations still respect RLS
*/

-- Drop the old complex policies that cause recursion
DROP POLICY IF EXISTS "Users can add themselves to new families" ON family_members;
DROP POLICY IF EXISTS "Authenticated users can create subscriptions for their families" ON subscriptions;

-- Create function to auto-create family for new user
CREATE OR REPLACE FUNCTION auto_create_family_for_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_family_id uuid;
BEGIN
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

  RETURN NEW;
END;
$$;

-- Create trigger on users table
DROP TRIGGER IF EXISTS auto_create_family_trigger ON users;

CREATE TRIGGER auto_create_family_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION auto_create_family_for_user();

-- Simplified INSERT policy for family_members (for invitations)
CREATE POLICY "Parents can invite members to their families"
  ON family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if the inviter is a parent in this family
    EXISTS (
      SELECT 1 FROM family_members existing
      WHERE existing.family_id = family_members.family_id
      AND existing.user_id = auth.uid()
      AND existing.role = 'PARENT'
      AND existing.status = 'ACTIVE'
    )
  );

-- Simplified INSERT policy for subscriptions (only for admins to manage)
CREATE POLICY "Only admins can manage subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.global_role = 'ADMIN'
    )
  );
