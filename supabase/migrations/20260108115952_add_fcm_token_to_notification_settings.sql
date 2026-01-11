/*
  # Add FCM token to notification settings

  1. Changes
    - Add `fcm_token` column to `notification_settings` table
      - Stores the Firebase Cloud Messaging device token
      - NULL if user hasn't enabled push notifications yet
    - Add `push_notifications_enabled` column
      - Master toggle for push notifications (FCM)
      - Works independently from browser_notifications_enabled
  
  2. Notes
    - FCM tokens are device-specific and can change over time
    - NULL tokens are valid (user hasn't enabled push yet)
    - Push notifications work even when browser/app is closed
*/

-- Add FCM token column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_settings' AND column_name = 'fcm_token'
  ) THEN
    ALTER TABLE notification_settings ADD COLUMN fcm_token text;
  END IF;
END $$;

-- Add push notifications enabled toggle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_settings' AND column_name = 'push_notifications_enabled'
  ) THEN
    ALTER TABLE notification_settings ADD COLUMN push_notifications_enabled boolean DEFAULT true NOT NULL;
  END IF;
END $$;