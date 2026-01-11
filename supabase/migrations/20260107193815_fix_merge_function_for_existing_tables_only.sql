/*
  # Fix merge function to only update existing tables

  ## Problem
  The merge_families_on_invite function tries to update tables (logs, requests, questions, helpers)
  that don't exist yet, causing the function to fail.

  ## Solution
  Update the function to only merge children (the only related table that exists)

  ## Changes
  1. Replace merge_families_on_invite function to only handle existing tables
*/

-- Replace function to only handle existing tables
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
