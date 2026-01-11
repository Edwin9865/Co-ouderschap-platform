/*
  # Allow Helpers to View Requests

  1. Changes
    - Update requests SELECT policy to allow helpers to view requests
    - Helpers have read-only access through child_visibility
    
  2. Security
    - Helpers can only view requests for children they have visibility to
    - They cannot create, update or delete requests
*/

DROP POLICY IF EXISTS "Users can view requests for accessible children" ON requests;

CREATE POLICY "Users can view requests for accessible children"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = requests.family_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'ACTIVE'
        AND (
          fm.role = 'PARENT'
          OR (
            fm.role = 'HELPER'
            AND (
              requests.child_id IS NULL
              OR EXISTS (
                SELECT 1 FROM child_visibility cv
                WHERE cv.child_id = requests.child_id
                  AND cv.user_id = auth.uid()
              )
            )
          )
        )
    )
  );
