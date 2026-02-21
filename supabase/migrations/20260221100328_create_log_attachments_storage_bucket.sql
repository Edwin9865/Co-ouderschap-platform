/*
  # Create Storage Bucket for Log Attachments

  1. Storage Bucket
    - `log-attachments` bucket for images and PDFs
    - File size limits: 10MB per file
    - Allowed MIME types: images (JPEG, PNG, HEIC) and PDF
    - Private bucket with RLS policies

  2. Security (RLS Policies)
    - Users can upload files to their own family's folder
    - Users can view files from families they belong to
    - Files are organized by family: `{family_id}/{log_entry_id}/{filename}`
    
  3. Notes
    - Images will be compressed client-side before upload
    - No deletion allowed (per requirements)
    - Maximum 5 files per log entry (enforced in application layer)
*/

-- Create storage bucket for log attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'log-attachments',
  'log-attachments',
  false,
  10485760, -- 10MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload files to their family's folder
CREATE POLICY "Users can upload files to own family folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'log-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = auth.uid()
      AND fm.status = 'ACTIVE'
      AND f.status = 'ACTIVE'
  )
);

-- Policy: Users can view files from their families
CREATE POLICY "Users can view files from their families"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'log-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT f.id::text
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = auth.uid()
      AND fm.status = 'ACTIVE'
      AND f.status = 'ACTIVE'
  )
);

-- Policy: No deletion allowed (per requirements)
-- Intentionally no DELETE policy created