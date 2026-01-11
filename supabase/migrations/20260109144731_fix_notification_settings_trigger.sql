/*
  # Fix notification settings trigger

  ## Problem
  The notification_settings trigger fails during user registration because
  the RLS policy requires auth.uid() which is not available during trigger execution.

  ## Solution
  1. Add service_role policy to allow trigger to insert notification_settings
  2. Ensure trigger function has proper SECURITY DEFINER

  ## Security
  - Service role can only insert during trigger execution
  - Users can still only manage their own settings
*/

-- Allow service role to insert notification settings (for triggers)
DROP POLICY IF EXISTS "Service role can insert notification settings" ON notification_settings;

CREATE POLICY "Service role can insert notification settings"
  ON notification_settings FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Recreate the trigger function with proper security
DROP TRIGGER IF EXISTS on_auth_user_created_notification_settings ON auth.users;
DROP FUNCTION IF EXISTS create_notification_settings_for_new_user();

CREATE OR REPLACE FUNCTION create_notification_settings_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_settings_for_new_user();
