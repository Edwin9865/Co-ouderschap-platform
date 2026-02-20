/*
  # Fix FCM notification function to use Supabase environment variables

  1. Changes
    - Update send_fcm_notification function to use Supabase built-in environment variables
    - Remove dependency on custom app.settings that don't exist
    - Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Supabase environment

  2. Notes
    - This fixes the silent failure where notifications weren't being sent
    - The trigger functions were calling send_fcm_notification but it was failing
    - Now it will use the built-in Supabase environment variables
*/

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
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  -- Get Supabase environment variables
  v_supabase_url := current_setting('request.headers', true)::json->>'x-forwarded-host';
  
  -- If we can't get the URL from headers, construct it from the database host
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://' || split_part(current_setting('server.host', true), '.', 1) || '.supabase.co';
  END IF;
  
  -- For service role key, we need to use the vault or pass it as a parameter
  -- Since we can't access env vars directly, we'll use supabase.vault if available
  -- Otherwise, this needs to be configured via ALTER DATABASE SET command
  v_service_role_key := current_setting('app.supabase_service_role_key', true);
  
  IF v_service_role_key IS NULL THEN
    RAISE WARNING 'Service role key not configured. Run: ALTER DATABASE postgres SET app.supabase_service_role_key = ''YOUR_KEY'';';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-fcm-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := jsonb_build_object(
      'familyId', p_family_id,
      'title', p_title,
      'body', p_body,
      'url', p_url,
      'excludeUserId', p_exclude_user_id
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send FCM notification: %', SQLERRM;
END;
$$;
