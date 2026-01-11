/*
  # Migrate existing counter proposals to new table

  1. Changes
    - Copy all existing counter_proposal data to request_proposals table
    - Preserves the history of existing counter proposals
  
  2. Notes
    - Uses last_action_by as the proposed_by user
    - Only migrates non-null counter_proposal entries
*/

INSERT INTO request_proposals (request_id, proposed_by, proposal_text, created_at)
SELECT 
  id as request_id,
  last_action_by as proposed_by,
  counter_proposal as proposal_text,
  updated_at as created_at
FROM requests
WHERE counter_proposal IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM request_proposals rp 
  WHERE rp.request_id = requests.id 
  AND rp.proposal_text = requests.counter_proposal
);