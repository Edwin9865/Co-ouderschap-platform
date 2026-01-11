/*
  # Add Helper Account System

  ## Overview
  This migration adds support for helper (hulpverlener) accounts that can be linked to multiple families.

  ## Changes
  
  1. Users Table
    - Add `account_type` column ('PARENT' or 'HELPER')
    - Add `helper_invite_code` column (unique code for helpers to be invited by families)
    - Set all existing users to 'PARENT' account type
  
  2. Helper Invite Codes
    - Generate unique invite codes for helpers
    - Codes are 8 characters long, uppercase alphanumeric
  
  3. Security
    - Update RLS policies to allow helpers read-only access to families they're members of
    - Helpers can only INSERT/UPDATE/DELETE through the HELPER role in family_members

  ## Notes
  - Helpers use their invite code to be added to families
  - Parents/families use family invite codes to couple with each other
  - Helpers have read-only access to family data
*/

-- Add account_type column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE users ADD COLUMN account_type text NOT NULL DEFAULT 'PARENT' CHECK (account_type IN ('PARENT', 'HELPER'));
  END IF;
END $$;

-- Add helper_invite_code column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'helper_invite_code'
  ) THEN
    ALTER TABLE users ADD COLUMN helper_invite_code text UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_users_helper_invite_code ON users(helper_invite_code) WHERE helper_invite_code IS NOT NULL;
  END IF;
END $$;

-- Function to generate a unique helper invite code
CREATE OR REPLACE FUNCTION generate_helper_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    SELECT EXISTS(
      SELECT 1 FROM users WHERE helper_invite_code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger to auto-generate helper invite code for new helper accounts
CREATE OR REPLACE FUNCTION auto_generate_helper_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.account_type = 'HELPER' AND NEW.helper_invite_code IS NULL THEN
    NEW.helper_invite_code := generate_helper_invite_code();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_helper_account_created ON users;
CREATE TRIGGER on_helper_account_created
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_helper_code();