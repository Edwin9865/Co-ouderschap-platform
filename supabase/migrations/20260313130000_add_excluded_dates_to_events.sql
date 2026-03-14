-- Add excluded_dates to events table
-- Used to skip specific occurrence dates when editing a single instance
-- of a recurring event series ("only this event" mode).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS excluded_dates text[] DEFAULT '{}';
