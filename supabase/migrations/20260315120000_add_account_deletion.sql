-- Add soft-delete fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_email text;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- ============================================================================
-- FUNCTION: delete_user_account
-- Checks for active co-parents, then anonymizes user data (soft delete).
-- Family data (children, logbook, calendar) is preserved for the co-parent.
-- After 2 years with no active co-parent, data can be purged via a cron job.
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_family_id uuid;
  v_coparent_count integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Niet ingelogd');
  END IF;

  -- Already deleted
  IF EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND deleted_at IS NOT NULL) THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Get family
  SELECT family_id INTO v_family_id
  FROM family_members
  WHERE user_id = v_user_id AND role = 'PARENT' AND status = 'ACTIVE'
  LIMIT 1;

  -- Block deletion if still coupled to an active co-parent
  IF v_family_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_coparent_count
    FROM family_members
    WHERE family_id = v_family_id
      AND user_id != v_user_id
      AND role = 'PARENT'
      AND status = 'ACTIVE';

    IF v_coparent_count > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Je bent nog gekoppeld met een co-ouder. Ontkoppel eerst via Instellingen → Koppelen voordat je je account verwijdert.'
      );
    END IF;
  END IF;

  -- Anonymize personal data, preserve row for referential integrity
  UPDATE users SET
    deleted_email = email,
    name          = 'Verwijderde gebruiker',
    email         = 'deleted_' || v_user_id || '@deleted.invalid',
    deleted_at    = now(),
    updated_at    = now()
  WHERE id = v_user_id;

  -- Deactivate family membership
  UPDATE family_members
  SET status = 'INACTIVE'
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
