/*
  # Remove automatic child visibility grant

  ## Problem
  The trigger that automatically grants visibility to the creator interferes with 
  the explicit sharing logic in the frontend. Users should explicitly choose whether
  to share children with co-parents.

  ## Solution
  Remove the auto-grant trigger. The frontend now handles all visibility grants explicitly.

  ## Changes
  1. Drop the auto_grant_child_visibility trigger
  2. Drop the grant_visibility_to_creator function
  
  ## Notes
  - Frontend will handle visibility grants when creating children
  - Creator implicitly has access via family_members, doesn't need child_visibility
*/

DROP TRIGGER IF EXISTS auto_grant_child_visibility ON children;
DROP FUNCTION IF EXISTS grant_visibility_to_creator();