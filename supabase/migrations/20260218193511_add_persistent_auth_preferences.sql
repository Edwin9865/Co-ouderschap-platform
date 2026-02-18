/*
  # Add Persistent Authentication Preferences

  1. Changes
    - Add `remember_me_enabled` column to users table
    - Add `last_active_at` column to track user activity
    - Add index for efficient last_active_at queries
  
  2. Security
    - No RLS changes needed - these are private user fields
    - Users can only see/modify their own preferences through app logic
  
  3. Purpose
    - Enable users to opt-in to persistent authentication
    - Track last activity for automatic session timeout (30 days)
    - Improve user experience by reducing login frequency
*/

-- Add remember me preference column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'remember_me_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN remember_me_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add last active timestamp column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Create index for efficient last_active_at queries
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);

-- Create function to update last_active_at
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_active_at on user updates
DROP TRIGGER IF EXISTS trigger_update_user_last_active ON users;
CREATE TRIGGER trigger_update_user_last_active
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_active();
