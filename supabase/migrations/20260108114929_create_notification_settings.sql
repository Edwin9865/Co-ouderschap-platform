/*
  # Create notification settings table

  1. New Tables
    - `notification_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `requests_enabled` (boolean) - Enable notifications for new requests
      - `events_enabled` (boolean) - Enable notifications for agenda items
      - `logs_enabled` (boolean) - Enable notifications for logboek entries
      - `browser_notifications_enabled` (boolean) - Master toggle for browser notifications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `notification_settings` table
    - Add policy for users to read their own notification settings
    - Add policy for users to update their own notification settings
    - Add policy for users to insert their own notification settings
  
  3. Notes
    - Each user has one notification settings record
    - Default: all notifications enabled
    - Includes trigger to auto-create settings for new users
*/

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  requests_enabled boolean DEFAULT true NOT NULL,
  events_enabled boolean DEFAULT true NOT NULL,
  logs_enabled boolean DEFAULT true NOT NULL,
  browser_notifications_enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- Create notification settings for existing users
INSERT INTO notification_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Trigger to create notification settings for new users
CREATE OR REPLACE FUNCTION create_notification_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_settings_for_new_user();