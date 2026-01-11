/*
  # Add Recurrence Support to Events

  1. Changes
    - Add `recurrence_rule` column to `events` table for storing recurrence patterns
    - Add `recurrence_end_date` column to specify when recurring events should stop
    - Add `parent_event_id` column to link recurring event instances to their parent

  2. Notes
    - recurrence_rule will store patterns like 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
    - parent_event_id references the original event for recurring instances
    - Existing events will have NULL values (one-time events)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'recurrence_rule'
  ) THEN
    ALTER TABLE events ADD COLUMN recurrence_rule text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE events ADD COLUMN recurrence_end_date timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'parent_event_id'
  ) THEN
    ALTER TABLE events ADD COLUMN parent_event_id uuid DEFAULT NULL REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;