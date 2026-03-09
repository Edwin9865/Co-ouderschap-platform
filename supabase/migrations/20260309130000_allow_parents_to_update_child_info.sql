/*
  # Allow all family parents to update child info fields and accounts

  ## Business Rules (updated)
  - Only the creator (created_by) can update BASIC details (first_name, birth_year, color)
  - Only the creator (created_by) can DELETE the child
  - Any ACTIVE PARENT in the same family can update INFO fields and accounts_notes
    (clothing_size, shoe_size, insurance, meds_allergy, vaccinations,
     social_security_num, passport_num, passport_location, other_info, accounts_notes)

  ## Approach
  Replace the creator-only UPDATE policy with one that allows any active parent
  in the family to update the child. The UI enforces which fields each user may edit.
  DELETE remains creator-only.
*/

-- Drop the strict creator-only UPDATE policy
DROP POLICY IF EXISTS "Only creator can update their children" ON children;

-- New policy: any ACTIVE PARENT in the same family may update the child
CREATE POLICY "Family parents can update children"
  ON children
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
        AND role = 'PARENT'
        AND status = 'ACTIVE'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
        AND role = 'PARENT'
        AND status = 'ACTIVE'
    )
  );
