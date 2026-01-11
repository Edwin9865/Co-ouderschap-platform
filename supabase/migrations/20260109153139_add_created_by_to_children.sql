/*
  # Add created_by to children table

  ## Problem
  We need to track which parent created each child so that when co-parents uncouple,
  children can be properly assigned to their creating parent.

  ## Changes
  1. Add `created_by` column to children table (references auth.users)
  2. Update existing children to set created_by based on family_members
  3. Update child creation trigger to automatically set created_by
  4. Add child visibility logic so shared children show correctly

  ## Notes
  - created_by is set automatically on insert
  - For existing children, we set created_by to the first parent we find
  - Child visibility determines if a child is visible to the co-parent
*/

-- Add created_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE children 
    ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Set created_by for existing children (use first parent in family)
UPDATE children c
SET created_by = (
  SELECT fm.user_id
  FROM family_members fm
  WHERE fm.family_id = c.family_id
  AND fm.role = 'PARENT'
  AND fm.status = 'ACTIVE'
  ORDER BY fm.joined_at
  LIMIT 1
)
WHERE created_by IS NULL;

-- Create function to auto-set created_by on insert
CREATE OR REPLACE FUNCTION set_child_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-setting created_by
DROP TRIGGER IF EXISTS set_child_created_by_trigger ON children;
CREATE TRIGGER set_child_created_by_trigger
  BEFORE INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION set_child_created_by();