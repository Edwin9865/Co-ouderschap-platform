/*
  # Create uncoupling function

  ## Purpose
  Allow parents to uncouple from each other. This splits the merged family back into
  two separate families, ensuring each parent retains the children they created.

  ## Changes
  1. Create `uncouple_parents` function that:
     - Creates a new family for the initiating user
     - Moves children back to their creator's family (based on created_by)
     - Removes child_visibility records between the uncoupling parents
     - Updates family_members for the initiating user
     - Keeps the original family for the other parent

  ## Notes
  - Children created by the initiating parent move to their new family
  - Children created by the other parent stay in the original family
  - All child_visibility between the two parents is removed
  - Other family members (helpers) are not affected
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

  SELECT family_id INTO current_family_id
  FROM family_members
  WHERE user_id = current_user_id
  AND role = 'PARENT'
  AND status = 'ACTIVE'
  LIMIT 1;

  IF current_family_id IS NULL THEN
    RAISE EXCEPTION 'No active family found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = current_family_id
    AND user_id = other_parent_user_id
    AND role = 'PARENT'
    AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Other parent not found in your family';
  END IF;

  INSERT INTO families (name, created_by)
  VALUES ('Mijn Gezin', current_user_id)
  RETURNING id INTO new_family_id;

  UPDATE family_members
  SET family_id = new_family_id
  WHERE user_id = current_user_id
  AND family_id = current_family_id;

  UPDATE children
  SET family_id = new_family_id
  WHERE family_id = current_family_id
  AND created_by = current_user_id;

  GET DIAGNOSTICS moved_children_count = ROW_COUNT;

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