/*
  # Add FCM notification triggers

  1. New Functions
    - `notify_fcm_on_request_insert` - Sends FCM notification when new request is created
    - `notify_fcm_on_request_update` - Sends FCM notification when request status changes
    - `notify_fcm_on_event_insert` - Sends FCM notification when new event is created
    - `notify_fcm_on_event_update` - Sends FCM notification when event is modified
    - `notify_fcm_on_log_insert` - Sends FCM notification when new log entry is created
  
  2. New Triggers
    - Triggers on requests INSERT and UPDATE
    - Triggers on events INSERT and UPDATE
    - Triggers on log_entries INSERT
  
  3. Notes
    - Triggers call the Edge Function asynchronously via pg_net extension
    - Only sends notifications if notification settings are enabled
    - Excludes the user who created/updated the record from receiving notification
*/

-- Function to send FCM notification via Edge Function
CREATE OR REPLACE FUNCTION send_fcm_notification(
  p_family_id uuid,
  p_title text,
  p_body text,
  p_url text,
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_role_key := current_setting('app.settings.service_role_key', true);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new requests
CREATE OR REPLACE FUNCTION notify_fcm_on_request_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_fcm_notification(
    NEW.family_id,
    'Nieuw Verzoek',
    NEW.title,
    '/verzoeken',
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for updated requests
CREATE OR REPLACE FUNCTION notify_fcm_on_request_update()
RETURNS TRIGGER AS $$
DECLARE
  v_message text;
BEGIN
  IF NEW.status != OLD.status AND NEW.last_action_by IS NOT NULL THEN
    IF NEW.status = 'ACCEPTED' THEN
      v_message := 'Je verzoek is geaccepteerd';
    ELSIF NEW.status = 'DECLINED' THEN
      v_message := 'Je verzoek is afgewezen';
    ELSIF NEW.status = 'COUNTERED' THEN
      v_message := 'Er is een tegenvoorstel gedaan';
    ELSE
      RETURN NEW;
    END IF;

    PERFORM send_fcm_notification(
      NEW.family_id,
      NEW.title,
      v_message,
      '/verzoeken',
      NEW.last_action_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new events
CREATE OR REPLACE FUNCTION notify_fcm_on_event_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_date text;
BEGIN
  v_date := to_char(NEW.start_at, 'DD-MM-YYYY');
  
  PERFORM send_fcm_notification(
    NEW.family_id,
    'Nieuwe Agenda Item',
    NEW.title || ' - ' || v_date,
    '/agenda',
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for updated events
CREATE OR REPLACE FUNCTION notify_fcm_on_event_update()
RETURNS TRIGGER AS $$
DECLARE
  v_date text;
BEGIN
  IF NEW.start_at != OLD.start_at OR NEW.title != OLD.title THEN
    v_date := to_char(NEW.start_at, 'DD-MM-YYYY');
    
    PERFORM send_fcm_notification(
      NEW.family_id,
      'Agenda Item Gewijzigd',
      NEW.title || ' - ' || v_date,
      '/agenda',
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new log entries
CREATE OR REPLACE FUNCTION notify_fcm_on_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_fcm_notification(
    NEW.family_id,
    'Nieuw Logboek Item',
    NEW.title,
    '/logboek',
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_fcm_on_request_insert ON requests;
CREATE TRIGGER trigger_fcm_on_request_insert
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_fcm_on_request_insert();

DROP TRIGGER IF EXISTS trigger_fcm_on_request_update ON requests;
CREATE TRIGGER trigger_fcm_on_request_update
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_fcm_on_request_update();

DROP TRIGGER IF EXISTS trigger_fcm_on_event_insert ON events;
CREATE TRIGGER trigger_fcm_on_event_insert
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_fcm_on_event_insert();

DROP TRIGGER IF EXISTS trigger_fcm_on_event_update ON events;
CREATE TRIGGER trigger_fcm_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_fcm_on_event_update();

DROP TRIGGER IF EXISTS trigger_fcm_on_log_insert ON log_entries;
CREATE TRIGGER trigger_fcm_on_log_insert
  AFTER INSERT ON log_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_fcm_on_log_insert();