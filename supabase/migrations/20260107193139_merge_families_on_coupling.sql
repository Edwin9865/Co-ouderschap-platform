/*
  # Merge families when coupling

  ## Problem
  When two parents couple using invite codes, they are added to each other's families
  but their original families remain separate. This causes:
  - Children remain in the original family and are not visible to the coupled parent
  - Family data is not shared between coupled parents
  - Each parent sees different data depending on which family is selected

  ## Solution
  Create a function that merges two families when a parent joins via invite code.
  When a user joins a family via invite code:
  1. Move all children from their old family to the new family
  2. Move all other data (logs, requests, questions, etc.) to the new family
  3. Mark the old family as MERGED (we keep it for audit trail)
  4. Remove the user's membership from their old family

  ## Changes
  1. Add status column to families table
  2. Create merge_families() function
  3. Create trigger to auto-merge when joining via invite code
*/

-- Add status to families table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'families' AND column_name = 'status'
  ) THEN
    ALTER TABLE families 
    ADD COLUMN status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MERGED', 'DELETED'));
  END IF;
END $$;

-- Create function to merge two families
CREATE OR REPLACE FUNCTION merge_families_on_invite(
  user_uuid uuid,
  from_family_uuid uuid,
  to_family_uuid uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_is_only_member boolean;
BEGIN
  -- Check if user is the only active member in their old family
  SELECT COUNT(*) = 1 INTO user_is_only_member
  FROM family_members
  WHERE family_id = from_family_uuid
    AND status = 'ACTIVE';

  -- Only merge if user is the only member (to avoid merging families with multiple parents)
  IF user_is_only_member THEN
    -- Move all children to the new family
    UPDATE children
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all logs to the new family
    UPDATE logs
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all requests to the new family
    UPDATE requests
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all questions to the new family
    UPDATE questions
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all helpers to the new family
    UPDATE helpers
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Mark old family as merged
    UPDATE families
    SET status = 'MERGED'
    WHERE id = from_family_uuid;

    -- Remove user's membership from old family
    UPDATE family_members
    SET status = 'INACTIVE'
    WHERE family_id = from_family_uuid
      AND user_id = user_uuid;
  END IF;
END;
$$;

-- Create trigger function that calls merge after successful invite code join
CREATE OR REPLACE FUNCTION trigger_merge_families_on_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_old_family_id uuid;
BEGIN
  -- Only proceed if this is a new PARENT joining via invite code
  IF NEW.role = 'PARENT' AND NEW.status = 'ACTIVE' AND TG_OP = 'INSERT' THEN
    -- Find user's original family (where they are the only parent)
    SELECT fm.family_id INTO user_old_family_id
    FROM family_members fm
    WHERE fm.user_id = NEW.user_id
      AND fm.family_id != NEW.family_id
      AND fm.status = 'ACTIVE'
      AND fm.role = 'PARENT'
    LIMIT 1;

    -- If user has an old family, merge it
    IF user_old_family_id IS NOT NULL THEN
      PERFORM merge_families_on_invite(
        NEW.user_id,
        user_old_family_id,
        NEW.family_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on family_members INSERT
DROP TRIGGER IF EXISTS merge_families_after_join ON family_members;
CREATE TRIGGER merge_families_after_join
  AFTER INSERT ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_merge_families_on_join();
