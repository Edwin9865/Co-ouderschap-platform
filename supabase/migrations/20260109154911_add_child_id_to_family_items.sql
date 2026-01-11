/*
  # Add child_id to events, log_entries, and requests

  ## Problem
  Currently, events, log_entries, and requests are only linked to families,
  not to specific children. This means we cannot restrict visibility based on
  child sharing settings.

  ## Solution
  Add optional child_id foreign key to these tables. When an item is related to
  a specific child, the child_id will be set. When it's a general family item,
  child_id will be NULL.

  ## Changes
  1. Add child_id column to events table
  2. Add child_id column to log_entries table
  3. Add child_id column to requests table
  4. Add foreign key constraints

  ## Notes
  - child_id is optional (NULL allowed)
  - NULL child_id means it's a general family item visible to all family members
  - Non-NULL child_id means visibility is restricted based on child_visibility
*/

-- Add child_id to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'child_id'
  ) THEN
    ALTER TABLE events ADD COLUMN child_id uuid REFERENCES children(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_events_child_id ON events(child_id);
  END IF;
END $$;

-- Add child_id to log_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'log_entries' AND column_name = 'child_id'
  ) THEN
    ALTER TABLE log_entries ADD COLUMN child_id uuid REFERENCES children(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_log_entries_child_id ON log_entries(child_id);
  END IF;
END $$;

-- Add child_id to requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requests' AND column_name = 'child_id'
  ) THEN
    ALTER TABLE requests ADD COLUMN child_id uuid REFERENCES children(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_requests_child_id ON requests(child_id);
  END IF;
END $$;