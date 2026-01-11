/*
  # Create request proposals history table

  1. New Tables
    - `request_proposals`
      - `id` (uuid, primary key)
      - `request_id` (uuid, foreign key to requests)
      - `proposed_by` (uuid, foreign key to users)
      - `proposal_text` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `request_proposals` table
    - Add policy for family members to view proposals
    - Add policy for authenticated users to create proposals for their family's requests
  
  3. Notes
    - This table maintains a chronological history of all counter-proposals
    - All proposals remain visible to track the full negotiation history
*/

CREATE TABLE IF NOT EXISTS request_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL REFERENCES users(id),
  proposal_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE request_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view proposals"
  ON request_proposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      JOIN family_members fm ON fm.family_id = r.family_id
      WHERE r.id = request_proposals.request_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Family members can create proposals"
  ON request_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests r
      JOIN family_members fm ON fm.family_id = r.family_id
      WHERE r.id = request_proposals.request_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'ACTIVE'
    )
    AND proposed_by = auth.uid()
  );