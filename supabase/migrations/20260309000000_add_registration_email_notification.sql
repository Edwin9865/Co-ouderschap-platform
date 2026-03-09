-- Trigger: stuur admin-mail bij elke nieuwe gebruikersregistratie
-- Gebruikt pg_net (ingebouwd in Supabase) om de Edge Function aan te roepen

CREATE OR REPLACE FUNCTION notify_admin_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  account_type_val text;
BEGIN
  -- Haal account_type op uit de public.users tabel (even wachten tot trigger klaar is)
  SELECT account_type INTO account_type_val
  FROM public.users
  WHERE id = NEW.id;

  payload := jsonb_build_object(
    'type', 'registration',
    'data', jsonb_build_object(
      'email', NEW.email,
      'name', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'account_type', COALESCE(account_type_val, NEW.raw_user_meta_data->>'account_type', 'PARENT')
    )
  );

  -- Roep de Edge Function aan via pg_net (asynchroon, blokkeert registratie niet)
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-admin-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := payload::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Niet-kritiek: log maar stop registratie niet
  RAISE WARNING 'notify_admin_on_registration: kon e-mail niet sturen: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Koppel trigger aan auth.users (na insert van nieuwe gebruiker)
DROP TRIGGER IF EXISTS on_auth_user_registered_notify_admin ON auth.users;
CREATE TRIGGER on_auth_user_registered_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_registration();
