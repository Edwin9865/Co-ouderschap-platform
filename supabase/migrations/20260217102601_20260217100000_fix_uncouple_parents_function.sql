/*
  # Fix uncouple_parents function

  ## Problem
  The uncouple_parents function tries to insert into families with a created_by column
  that doesn't exist in the families table schema.

  ## Solution
  Update the function to remove the created_by reference from the INSERT statement.
  The families table only has: id, name, created_at, updated_at, status, invite_code

  ## Changes
  - Replace the INSERT statement to only use the 'name' column
  - Remove created_by from the families insert
*/

CREATE OR REPLACE FUNCTION uncouple_parents(
  other_parent_user_id uuid
)
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  current_family_id uuid;
  new_family_id uuid;
  moved_children_count int := 0;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current user's active family
  SELECT family_id INTO current_family_id
  FROM family_members
  WHERE user_id = current_user_id
  AND role = 'PARENT'
  AND status = 'ACTIVE'
  LIMIT 1;

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'No active family found';
  END IF;

  -- Verify other parent is in the same family
  IF NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = current_family_id
    AND user_id = other_parent_user_id
    AND role = 'PARENT'
    AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Other parent not found in your family';
  END IF;

  -- Create new family for the initiating user (without created_by column)
  INSERT INTO families (name)
  VALUES ('Mijn Gezin')
  RETURNING id INTO new_family_id;

  -- Move the initiating user to the new family
  UPDATE family_members
  SET family_id = new_family_id
  WHERE user_id = current_user_id
  AND family_id = current_family_id;

  -- Move children created by the initiating user to the new family
  UPDATE children
  SET family_id = new_family_id
  WHERE family_id = current_family_id
  AND created_by = current_user_id;

  GET DIAGNOSTICS moved_children_count = ROW_COUNT;

  -- Remove child visibility between the uncoupling parents
  DELETE FROM child_visibility cv
  WHERE cv.child_id IN (
    SELECT c.id FROM children c
    WHERE c.family_id IN (current_family_id, new_family_id)
  )
  AND (
    (cv.user_id = current_user_id AND cv.granted_by = other_parent_user_id) OR
    (cv.user_id = other_parent_user_id AND cv.granted_by = current_user_id)
  );

  RETURN json_build_object(
    'success', true,
    'new_family_id', new_family_id,
    'moved_children_count', moved_children_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
