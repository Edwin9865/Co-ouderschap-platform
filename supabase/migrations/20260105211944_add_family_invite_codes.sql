/*
  # Add family invite codes system

  ## Overview
  Replace the email-based invitation system with a simpler invite code system.
  First parent gets an auto-generated 6-character code they can share.
  Co-parent uses this code during registration to join the existing family.

  ## Changes
  1. New Tables
    - `family_invite_codes`
      - `id` (uuid, primary key)
      - `family_id` (uuid, foreign key to families)
      - `code` (text, unique 6-char code)
      - `created_at` (timestamp)
      - `used_by` (uuid, nullable, foreign key to users)
      - `used_at` (timestamp, nullable)

  2. Security
    - Enable RLS on invite_codes table
    - Parents can view their family's invite code
    - Anyone can validate a code (for registration)
    - Only system can create codes (via trigger)

  3. Triggers
    - Auto-generate invite code when family is created
*/

-- Create invite codes table
CREATE TABLE IF NOT EXISTS family_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  used_by uuid REFERENCES users(id) ON DELETE SET NULL,
  used_at timestamptz
);

-- Enable RLS
ALTER TABLE family_invite_codes ENABLE ROW LEVEL SECURITY;

-- Parents can view their family's invite code
CREATE POLICY "Parents can view their family invite code"
  ON family_invite_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = family_invite_codes.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'PARENT'
      AND family_members.status = 'ACTIVE'
    )
  );

-- Anyone can check if a code exists (needed for registration validation)
CREATE POLICY "Anyone can validate invite codes"
  ON family_invite_codes FOR SELECT
  TO anon
  USING (true);

-- Function to generate random 6-character code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger function to create invite code for new family
CREATE OR REPLACE FUNCTION create_family_invite_code()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := generate_invite_code();
    
    SELECT EXISTS(
      SELECT 1 FROM family_invite_codes WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;

  INSERT INTO family_invite_codes (family_id, code)
  VALUES (NEW.id, new_code);

  RETURN NEW;
END;
$$;

-- Trigger to auto-create invite code when family is created
DROP TRIGGER IF EXISTS create_invite_code_trigger ON families;

CREATE TRIGGER create_invite_code_trigger
AFTER INSERT ON families
FOR EACH ROW
EXECUTE FUNCTION create_family_invite_code();

-- Create invite codes for existing families
DO $$
DECLARE
  family_record RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR family_record IN SELECT id FROM families WHERE id NOT IN (SELECT family_id FROM family_invite_codes)
  LOOP
    LOOP
      new_code := generate_invite_code();
      
      SELECT EXISTS(
        SELECT 1 FROM family_invite_codes WHERE code = new_code
      ) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    INSERT INTO family_invite_codes (family_id, code)
    VALUES (family_record.id, new_code);
  END LOOP;
END $$;
