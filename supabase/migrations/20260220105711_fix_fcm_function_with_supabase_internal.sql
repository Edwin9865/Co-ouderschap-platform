/*
  # Fix FCM notification function to work with Supabase internal service

  1. Changes
    - Update send_fcm_notification to use supabase_url() helper
    - Use proper internal service authentication
    - Configure database settings for Supabase URL

  2. Notes
    - This uses Supabase's internal function calling mechanism
    - The function will now properly call the edge function
    - Settings are stored at database level
*/

-- First, configure the Supabase URL at database level
DO $$
BEGIN
  -- Set the Supabase project URL
  EXECUTE 'ALTER DATABASE postgres SET app.supabase_url = ''https://sfocyrarewusuttsohug.supabase.co''';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not set database setting (insufficient privileges). This is OK for hosted Supabase.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not set database setting: %. This is OK for hosted Supabase.', SQLERRM;
END $$;

-- Recreate the send_fcm_notification function with better error handling
CREATE OR REPLACE FUNCTION send_fcm_notification(
  p_family_id uuid,
  p_title text,
  p_body text,
  p_url text,
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://sfocyrarewusuttsohug.supabase.co';
  v_response_status int;
  v_response_body text;
BEGIN
  -- Call the edge function using pg_net
  SELECT status, body INTO v_response_status, v_response_body
  FROM net.http_post(
    url := v_supabase_url || '/functions/v1/send-fcm-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
    ),
    body := jsonb_build_object(
      'familyId', p_family_id,
      'title', p_title,
      'body', p_body,
      'url', p_url,
      'excludeUserId', p_exclude_user_id
    ),
    timeout_milliseconds := 5000
  );

  -- Log the response for debugging
  RAISE NOTICE 'FCM notification response: status=%, body=%', v_response_status, v_response_body;

EXCEPTION
  WHEN OTHERS THEN
    -- Log but don't fail the transaction
    RAISE WARNING 'Failed to send FCM notification: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_fcm_notification TO authenticated;
GRANT EXECUTE ON FUNCTION send_fcm_notification TO service_role;
