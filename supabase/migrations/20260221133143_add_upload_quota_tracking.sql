/*
  # Add Upload Quota Tracking System

  ## Changes

  1. **New Columns**
    - `families.upload_quota_used` (integer) - Tracks uploads used in current month
    - `families.quota_reset_date` (date) - Date when quota resets to 0

  2. **Helper Functions**
    - `get_family_plan()` - Returns FREE/PLUS/PRO plan for a family
    - `get_monthly_upload_limit()` - Returns upload limit based on plan (10 for FREE, unlimited for PLUS/PRO)
    - `can_upload_file()` - Checks if family can upload (quota check + plan check)
    - `increment_upload_quota()` - Increments usage counter and handles monthly reset

  3. **Security**
    - Functions use SECURITY DEFINER for quota checks
    - RLS policies remain unchanged

  ## Notes
  - FREE plan: 10 uploads per month
  - PLUS/PRO plans: unlimited uploads
  - Quota resets automatically on the 1st of each month
*/

-- Add quota tracking columns to families table
ALTER TABLE families
ADD COLUMN IF NOT EXISTS upload_quota_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_reset_date date DEFAULT CURRENT_DATE;

-- Create index for quota lookups
CREATE INDEX IF NOT EXISTS idx_families_quota_reset ON families(quota_reset_date);

-- Function to get family's subscription plan
CREATE OR REPLACE FUNCTION get_family_plan(p_family_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT plan INTO v_plan
  FROM subscriptions
  WHERE family_id = p_family_id
  AND status = 'ACTIVE';

  RETURN COALESCE(v_plan, 'FREE');
END;
$$;

-- Function to get monthly upload limit based on plan
CREATE OR REPLACE FUNCTION get_monthly_upload_limit(p_family_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
BEGIN
  v_plan := get_family_plan(p_family_id);

  CASE v_plan
    WHEN 'FREE' THEN
      RETURN 10;
    WHEN 'PLUS' THEN
      RETURN 999999; -- Effectively unlimited
    WHEN 'PRO' THEN
      RETURN 999999; -- Effectively unlimited
    ELSE
      RETURN 10; -- Default to FREE limits
  END CASE;
END;
$$;

-- Function to check if family can upload files
CREATE OR REPLACE FUNCTION can_upload_file(p_family_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota_used integer;
  v_quota_limit integer;
  v_reset_date date;
BEGIN
  -- Get current quota info
  SELECT upload_quota_used, quota_reset_date
  INTO v_quota_used, v_reset_date
  FROM families
  WHERE id = p_family_id;

  -- Reset quota if new month
  IF v_reset_date IS NULL OR v_reset_date < DATE_TRUNC('month', CURRENT_DATE)::date THEN
    UPDATE families
    SET upload_quota_used = 0,
        quota_reset_date = DATE_TRUNC('month', CURRENT_DATE)::date
    WHERE id = p_family_id;

    v_quota_used := 0;
  END IF;

  -- Get limit for this family's plan
  v_quota_limit := get_monthly_upload_limit(p_family_id);

  -- Check if under limit
  RETURN v_quota_used < v_quota_limit;
END;
$$;

-- Function to increment upload quota after successful upload
CREATE OR REPLACE FUNCTION increment_upload_quota(p_family_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_date date;
BEGIN
  -- Get current reset date
  SELECT quota_reset_date INTO v_reset_date
  FROM families
  WHERE id = p_family_id;

  -- Reset quota if new month
  IF v_reset_date IS NULL OR v_reset_date < DATE_TRUNC('month', CURRENT_DATE)::date THEN
    UPDATE families
    SET upload_quota_used = 1,
        quota_reset_date = DATE_TRUNC('month', CURRENT_DATE)::date
    WHERE id = p_family_id;
  ELSE
    -- Increment counter
    UPDATE families
    SET upload_quota_used = upload_quota_used + 1
    WHERE id = p_family_id;
  END IF;
END;
$$;

-- Function to get remaining uploads for a family
CREATE OR REPLACE FUNCTION get_remaining_uploads(p_family_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota_used integer;
  v_quota_limit integer;
  v_reset_date date;
BEGIN
  -- Get current quota info
  SELECT upload_quota_used, quota_reset_date
  INTO v_quota_used, v_reset_date
  FROM families
  WHERE id = p_family_id;

  -- Reset quota if new month
  IF v_reset_date IS NULL OR v_reset_date < DATE_TRUNC('month', CURRENT_DATE)::date THEN
    v_quota_used := 0;
  END IF;

  -- Get limit for this family's plan
  v_quota_limit := get_monthly_upload_limit(p_family_id);

  -- Return remaining (with minimum of 0)
  RETURN GREATEST(v_quota_limit - v_quota_used, 0);
END;
$$;