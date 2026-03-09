-- Add avatar_url column to children (stores uploaded photo path in storage)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Storage bucket for child avatar photos (public so img tags work without signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-avatars',
  'child-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Upload: only active parents in the child's family
CREATE POLICY "Parents can upload child avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'child-avatars' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM family_members
    WHERE user_id = auth.uid() AND role = 'PARENT' AND status = 'ACTIVE'
  )
);

-- View: any authenticated user (bucket is public anyway, belt-and-suspenders)
CREATE POLICY "Anyone can view child avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'child-avatars');

-- Delete: only active parents (so they can replace a photo)
CREATE POLICY "Parents can delete child avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'child-avatars' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text FROM family_members
    WHERE user_id = auth.uid() AND role = 'PARENT' AND status = 'ACTIVE'
  )
);
