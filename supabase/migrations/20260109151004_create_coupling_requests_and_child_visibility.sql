/*
  # Add coupling requests and child visibility system

  ## Overview
  This migration adds a robust coupling request system and child-level visibility controls.
  This allows:
  - Parents to request coupling with each other (must be approved)
  - Selective sharing of children between co-parents
  - New children can optionally be shared with co-parent
  - Support for blended families with step-children

  ## New Tables
  
  ### 1. `coupling_requests`
  Stores requests from one parent to couple with another parent
  - `id` (uuid, primary key)
  - `from_user_id` (uuid, the user sending the request)
  - `to_user_id` (uuid, the user receiving the request)
  - `from_family_id` (uuid, family of requester)
  - `to_family_id` (uuid, family of recipient)
  - `status` (text: PENDING, ACCEPTED, DECLINED)
  - `message` (text, optional message)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `child_visibility`
  Controls which parents can see which children
  - `id` (uuid, primary key)
  - `child_id` (uuid, reference to children table)
  - `user_id` (uuid, parent who can see this child)
  - `granted_by` (uuid, parent who granted access)
  - `created_at` (timestamptz)

  ## Changes
  1. Create coupling_requests table
  2. Create child_visibility table
  3. Enable RLS on both tables
  4. Add RLS policies for coupling_requests
  5. Add RLS policies for child_visibility
  6. Disable automatic merge trigger (will be replaced with request-based system)
*/

-- ============================================================================
-- COUPLING REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupling_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  to_family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id),
  CONSTRAINT different_families CHECK (from_family_id != to_family_id)
);

ALTER TABLE coupling_requests ENABLE ROW LEVEL SECURITY;

-- Users can view coupling requests they sent or received
CREATE POLICY "Users can view their coupling requests"
  ON coupling_requests FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Users can create coupling requests from their own family
CREATE POLICY "Users can create coupling requests"
  ON coupling_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND is_family_parent(from_family_id)
  );

-- Users can update requests they received (accept/decline)
CREATE POLICY "Recipients can update coupling requests"
  ON coupling_requests FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

-- Senders can cancel their own pending requests
CREATE POLICY "Senders can cancel their requests"
  ON coupling_requests FOR UPDATE
  TO authenticated
  USING (from_user_id = auth.uid() AND status = 'PENDING')
  WITH CHECK (from_user_id = auth.uid() AND status = 'CANCELLED');

-- ============================================================================
-- CHILD VISIBILITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS child_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(child_id, user_id)
);

ALTER TABLE child_visibility ENABLE ROW LEVEL SECURITY;

-- Users can view visibility records for children they can access
CREATE POLICY "Users can view child visibility in their families"
  ON child_visibility FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = child_visibility.child_id
      AND is_family_member(c.family_id)
    )
  );

-- Parents can grant visibility to children in their family
CREATE POLICY "Parents can grant child visibility"
  ON child_visibility FOR INSERT
  TO authenticated
  WITH CHECK (
    granted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = child_visibility.child_id
      AND is_family_parent(c.family_id)
    )
  );

-- Parents can revoke visibility they granted
CREATE POLICY "Parents can revoke child visibility"
  ON child_visibility FOR DELETE
  TO authenticated
  USING (
    granted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = child_visibility.child_id
      AND is_family_parent(c.family_id)
    )
  );

-- ============================================================================
-- UPDATE CHILDREN RLS POLICY
-- ============================================================================

-- Drop old children SELECT policy
DROP POLICY IF EXISTS "Users can view children in their families" ON children;

-- Create new policy that checks child_visibility
CREATE POLICY "Users can view children they have access to"
  ON children FOR SELECT
  TO authenticated
  USING (
    is_family_member(family_id)
    AND (
      -- Either user has explicit visibility
      EXISTS (
        SELECT 1 FROM child_visibility cv
        WHERE cv.child_id = children.id
        AND cv.user_id = auth.uid()
      )
      -- Or user is a parent who created/manages children in this family
      OR is_family_parent(family_id)
    )
  );

-- ============================================================================
-- DISABLE AUTOMATIC MERGE TRIGGER
-- ============================================================================

-- Drop the automatic merge trigger - we'll use coupling requests instead
DROP TRIGGER IF EXISTS merge_families_after_join ON family_members;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically grant visibility to child creator
CREATE OR REPLACE FUNCTION grant_visibility_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant visibility to the parent who created the child
  INSERT INTO child_visibility (child_id, user_id, granted_by)
  VALUES (NEW.id, auth.uid(), auth.uid())
  ON CONFLICT (child_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-grant visibility on child creation
DROP TRIGGER IF EXISTS auto_grant_child_visibility ON children;
CREATE TRIGGER auto_grant_child_visibility
  AFTER INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION grant_visibility_to_creator();