-- Add phone_numbers JSONB column to children table
-- Structure: [{ "id": "uuid", "name": "string", "phone": "string" }]
ALTER TABLE children ADD COLUMN IF NOT EXISTS phone_numbers jsonb DEFAULT '[]'::jsonb;
