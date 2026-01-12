/*
  # Auto-grant visibility for existing children when parent joins family
  
  ## Problem
  When a parent joins a family (e.g., after coupling), they cannot see 
  existing children in that family because there's no child_visibility entry.
  
  ## Solution
  Create a trigger that automatically grants visibility to all existing children
  in the family when a PARENT is added to the family_members table.
  
  ## Changes
  1. Create trigger function to grant visibility for existing children
  2. Apply trigger on family_members INSERT/UPDATE
*/

-- Function to grant visibility for existing children when parent joins
CREATE OR REPLACE FUNCTION grant_visibility_for_existing_children()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if the member is a PARENT with ACTIVE status
  IF NEW.role = 'PARENT' AND NEW.status = 'ACTIVE' THEN
    -- Grant visibility to all existing children in this family
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    SELECT 
      c.id,
      NEW.user_id,
      c.created_by
    FROM children c
    WHERE c.family_id = NEW.family_id
      AND c.created_by != NEW.user_id
    ON CONFLICT (child_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on family_members table
DROP TRIGGER IF EXISTS auto_grant_visibility_on_family_join_trigger ON family_members;
CREATE TRIGGER auto_grant_visibility_on_family_join_trigger
  AFTER INSERT OR UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION grant_visibility_for_existing_children();
