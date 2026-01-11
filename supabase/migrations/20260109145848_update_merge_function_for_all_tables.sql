/*
  # Update merge function to migrate all family data

  ## Problem
  When families merge, only children are moved. Other data like events,
  log_entries, and requests remain in the old family, causing data to be
  invisible to the coupled parent.

  ## Solution
  Update the merge_families_on_invite function to also move:
  - events
  - log_entries  
  - requests

  ## Changes
  1. Update merge_families_on_invite to move all family-related data
*/

-- Update function to handle all existing tables
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

    -- Move all events to the new family
    UPDATE events
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all log_entries to the new family
    UPDATE log_entries
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all requests to the new family
    UPDATE requests
    SET family_id = to_family_uuid
    WHERE family_id = from_family_uuid;

    -- Move all questions to the new family (if table exists)
    UPDATE questions
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