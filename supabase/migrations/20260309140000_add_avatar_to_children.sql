-- Add avatar fields to children table
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS avatar_style text,
  ADD COLUMN IF NOT EXISTS avatar_seed  text;
