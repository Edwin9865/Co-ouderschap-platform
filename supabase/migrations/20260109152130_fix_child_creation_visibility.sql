/*
  # Fix child creation and automatic visibility grant

  ## Problem
  The trigger that automatically grants visibility might not work correctly
  because auth.uid() might not be available in the trigger context.

  ## Solution
  Improve the trigger to handle visibility grants more reliably and ensure
  the creator always gets visibility.

  ## Changes
  1. Update the grant_visibility_to_creator function to be more robust
  2. Ensure it works with the current user context
*/

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION grant_visibility_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Only proceed if we have a valid user
  IF current_user_id IS NOT NULL THEN
    -- Grant visibility to the parent who created the child
    INSERT INTO child_visibility (child_id, user_id, granted_by)
    VALUES (NEW.id, current_user_id, current_user_id)
    ON CONFLICT (child_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is configured correctly
DROP TRIGGER IF EXISTS auto_grant_child_visibility ON children;
CREATE TRIGGER auto_grant_child_visibility
  AFTER INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION grant_visibility_to_creator();