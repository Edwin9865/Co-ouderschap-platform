/*
  # Fix: handle_new_user trigger — respect account_type from signup metadata

  ## Problem
  The trigger that auto-creates a user profile in public.users ignores the
  `account_type` field from auth metadata. It only inserts id/email/name/global_role,
  so account_type always defaults to 'PARENT' — even when the user registered as
  'HELPER'. This affects both flows:
  - Direct signup (no email confirmation): a subsequent UPDATE fixes it, but briefly wrong.
  - Email-confirmation flow: signUp() returns early before the UPDATE, so the
    account_type stays 'PARENT' permanently.

  ## Fix
  Read `account_type` from `raw_user_meta_data` in the trigger function.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_account_type text;
BEGIN
  v_account_type := COALESCE(
    NEW.raw_user_meta_data->>'account_type',
    'PARENT'
  );

  -- Validate value; fall back to PARENT if garbage data comes in
  IF v_account_type NOT IN ('PARENT', 'HELPER') THEN
    v_account_type := 'PARENT';
  END IF;

  INSERT INTO public.users (id, email, name, account_type, global_role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_account_type,
    'USER',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
