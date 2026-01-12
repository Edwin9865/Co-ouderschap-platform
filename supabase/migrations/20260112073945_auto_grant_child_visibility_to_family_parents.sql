/*
  # Auto-grant child visibility to all family parents
  
  ## Problem
  When a child is created or when parents couple, the other parent(s) 
  in the family cannot see the child because there's no child_visibility entry.
  
  ## Solution
  Create a trigger that automatically grants visibility to all ACTIVE PARENT
  members in the same family when a child is created.
  
  ## Changes
  1. Create trigger function to auto-grant visibility
  2. Apply trigger on children INSERT
*/

-- Function to auto-grant child visibility to all parents in family
CREATE OR REPLACE FUNCTION grant_child_visibility_to_family_parents()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grant visibility to all ACTIVE PARENT members in the child's family
  -- except the creator (who already has implicit access as created_by)
  INSERT INTO child_visibility (child_id, user_id, granted_by)
  SELECT 
    NEW.id,
    fm.user_id,
    NEW.created_by
  FROM family_members fm
  WHERE fm.family_id = NEW.family_id
    AND fm.role = 'PARENT'
    AND fm.status = 'ACTIVE'
    AND fm.user_id != NEW.created_by
  ON CONFLICT (child_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on children table
DROP TRIGGER IF EXISTS auto_grant_child_visibility_trigger ON children;
CREATE TRIGGER auto_grant_child_visibility_trigger
  AFTER INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION grant_child_visibility_to_family_parents();
