/*
  # Add color field to children table

  ## Changes
  1. Add color column to children table (stores hex color code)
  2. Set default colors for visual distinction
*/

-- Add color column to children table
ALTER TABLE children 
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';

-- Add a comment to document the column
COMMENT ON COLUMN children.color IS 'Hex color code for visual identification (e.g., #3b82f6)';