/*
  # Create helper_messages table

  ## Overview
  This table stores messages between helpers (hulpverleners) and parents.
  It supports both direct messages (to specific parents) and group messages (to all parents).

  ## Tables
  
  ### helper_messages
  - `id` (uuid, primary key): Unique identifier for each message
  - `family_id` (uuid, foreign key): Which family this message belongs to
  - `sender_id` (uuid, foreign key): The user who sent the message
  - `recipient_id` (uuid, nullable, foreign key): Specific recipient (NULL = group message)
  - `subject` (text): Message subject line
  - `message` (text): Message content
  - `parent_message_id` (uuid, nullable): Reference to parent message (for replies)
  - `is_read` (boolean): Whether the message has been read
  - `status` (text): Message status (NIEUW, MOET_BEANTWOORDEN, BEANTWOORD)
  - `has_responded_users` (jsonb): Array of user IDs who have responded
  - `helper_has_read_replies` (uuid[]): Array of reply IDs the helper has read
  - `closed` (boolean): Whether the message thread is closed
  - `closed_at` (timestamptz): When the message was closed
  - `closed_by` (uuid): Who closed the message
  - `created_at` (timestamptz): When the message was created
  - `updated_at` (timestamptz): When the message was last updated

  ## Security
  - RLS enabled on helper_messages table
  - Users can see messages they sent
  - Users can see messages sent to them
  - Users can see group messages if they're active family members
  - Only authenticated users can insert messages
  - Only message sender can update their own messages
*/

-- Create helper_messages table
CREATE TABLE IF NOT EXISTS helper_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  parent_message_id uuid REFERENCES helper_messages(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'NIEUW' CHECK (status IN ('NIEUW', 'MOET_BEANTWOORDEN', 'BEANTWOORD')),
  has_responded_users jsonb NOT NULL DEFAULT '[]'::jsonb,
  helper_has_read_replies uuid[] DEFAULT ARRAY[]::uuid[],
  closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  closed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_helper_messages_family_id ON helper_messages(family_id);
CREATE INDEX IF NOT EXISTS idx_helper_messages_sender_id ON helper_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_helper_messages_recipient_id ON helper_messages(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_helper_messages_parent_id ON helper_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_helper_messages_status ON helper_messages(status);
CREATE INDEX IF NOT EXISTS idx_helper_messages_has_responded ON helper_messages USING gin(has_responded_users);
CREATE INDEX IF NOT EXISTS idx_helper_messages_helper_read_replies ON helper_messages USING gin(helper_has_read_replies);

-- Enable RLS
ALTER TABLE helper_messages ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can view their messages
CREATE POLICY "Users can view their messages"
  ON helper_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR
    recipient_id = auth.uid()
    OR
    (
      recipient_id IS NULL 
      AND EXISTS (
        SELECT 1 
        FROM family_members fm 
        WHERE fm.family_id = helper_messages.family_id 
          AND fm.user_id = auth.uid() 
          AND fm.status = 'ACTIVE'
      )
    )
  );

-- INSERT policy: Authenticated users can create messages in their families
CREATE POLICY "Users can create messages in their families"
  ON helper_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM family_members fm 
      WHERE fm.family_id = helper_messages.family_id 
        AND fm.user_id = auth.uid() 
        AND fm.status = 'ACTIVE'
    )
    AND sender_id = auth.uid()
  );

-- UPDATE policy: Users can update their own messages
CREATE POLICY "Users can update their own messages"
  ON helper_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- DELETE policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON helper_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Function to update parent message status to BEANTWOORD when a reply is created
CREATE OR REPLACE FUNCTION update_parent_message_status_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE helper_messages
    SET status = 'BEANTWOORD'
    WHERE id = NEW.parent_message_id
    AND status != 'BEANTWOORD';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic status update on reply
DROP TRIGGER IF EXISTS on_helper_message_reply_created ON helper_messages;
CREATE TRIGGER on_helper_message_reply_created
  AFTER INSERT ON helper_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_message_status_on_reply();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_helper_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS on_helper_messages_updated ON helper_messages;
CREATE TRIGGER on_helper_messages_updated
  BEFORE UPDATE ON helper_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_helper_messages_updated_at();
