/*
  # Restrict Log Entry Editing to Creator Only

  1. Changes
    - Drop existing UPDATE policy for log_entries that allows all parents to edit
    - Create new UPDATE policy that only allows the creator to edit their own entries
    - Maintain existing DELETE protection (soft deletes only via UPDATE)

  2. Security
    - Only the creator (created_by) can update or soft-delete their log entries
    - Other parents can still view entries but cannot modify them
*/

-- Drop the existing policy that allows all parents to update
DROP POLICY IF EXISTS "Parents can update log entries" ON log_entries;

-- Create new policy: only creator can update their own entries
CREATE POLICY "Creators can update their own log entries"
  ON log_entries FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
