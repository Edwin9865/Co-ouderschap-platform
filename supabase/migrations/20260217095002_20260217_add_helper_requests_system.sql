/*
  # Add Helper Request System

  ## Overview
  This migration adds a request/approval system for helpers to join families,
  similar to the coupling request system for co-parents.

  ## Changes

  1. New Table: helper_requests
    - `id` (uuid, primary key)
    - `helper_id` (uuid, references users.id) - The helper requesting access
    - `family_id` (uuid, references families.id) - The family being requested
    - `status` (text) - PENDING, APPROVED, REJECTED, CANCELLED
    - `requested_at` (timestamptz) - When the request was made
    - `responded_at` (timestamptz) - When it was approved/rejected
    - `responded_by` (uuid, references users.id) - Which parent responded
    - `message` (text) - Optional message from helper
    - Unique constraint on (helper_id, family_id, status) where status = 'PENDING'

  2. Security
    - Enable RLS on helper_requests table
    - Helpers can INSERT their own requests and SELECT their own requests
    - Family members can SELECT requests for their families
    - Family members can UPDATE status (approve/reject)

  ## Notes
  - Existing helper relationships remain unchanged (backwards compatible)
  - Only helpers (account_type = 'HELPER') can create helper requests
  - Only parents in the family can approve/reject requests
*/

-- Create helper_requests table
CREATE TABLE IF NOT EXISTS helper_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  responded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_helper_requests_helper_id ON helper_requests(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_requests_family_id ON helper_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_helper_requests_status ON helper_requests(status);

-- Unique constraint: only one pending request per helper-family combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_helper_requests_unique_pending 
  ON helper_requests(helper_id, family_id) 
  WHERE status = 'PENDING';

-- Enable RLS
ALTER TABLE helper_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Helpers can insert their own requests
CREATE POLICY "Helpers can create requests"
  ON helper_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = helper_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'HELPER'
    )
  );

-- Policy: Helpers can view their own requests
CREATE POLICY "Helpers can view own requests"
  ON helper_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = helper_id);

-- Policy: Family members can view requests for their families
CREATE POLICY "Family members can view requests for their families"
  ON helper_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = helper_requests.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.status = 'ACTIVE'
    )
  );

-- Policy: Family parents can update request status (approve/reject)
CREATE POLICY "Family parents can respond to requests"
  ON helper_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = helper_requests.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'PARENT'
      AND family_members.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = helper_requests.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'PARENT'
      AND family_members.status = 'ACTIVE'
    )
  );

-- Policy: Helpers can cancel their own pending requests
CREATE POLICY "Helpers can cancel own pending requests"
  ON helper_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = helper_id
    AND status = 'PENDING'
  )
  WITH CHECK (
    auth.uid() = helper_id
    AND status IN ('PENDING', 'CANCELLED')
  );

-- Function to auto-add helper to family when request is approved
CREATE OR REPLACE FUNCTION handle_helper_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if status changed to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Add helper to family_members if not already a member
    INSERT INTO family_members (family_id, user_id, role, status)
    VALUES (NEW.family_id, NEW.helper_id, 'HELPER', 'ACTIVE')
    ON CONFLICT (family_id, user_id) DO NOTHING;
    
    -- Set responded_at and responded_by
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  END IF;
  
  -- If rejected, set responded_at and responded_by
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to handle approval
DROP TRIGGER IF EXISTS on_helper_request_approved ON helper_requests;
CREATE TRIGGER on_helper_request_approved
  BEFORE UPDATE ON helper_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_helper_request_approval();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_helper_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_helper_requests_timestamp ON helper_requests;
CREATE TRIGGER update_helper_requests_timestamp
  BEFORE UPDATE ON helper_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_helper_requests_updated_at();
