-- Materials Storage Setup
-- Creates storage bucket and RLS policies for user materials

-- Create the materials storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  true, -- Public bucket for easy access
  52428800, -- 50MB file size limit
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow authenticated users to upload their own materials
CREATE POLICY "Users can upload their own materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to view their own materials
CREATE POLICY "Users can view their own materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow public access to materials (optional - remove if you want private files)
CREATE POLICY "Public can view materials"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'materials'
);

-- Policy 4: Allow authenticated users to delete their own materials
CREATE POLICY "Users can delete their own materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Allow authenticated users to update their own materials
CREATE POLICY "Users can update their own materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the setup
SELECT 
  'Bucket created successfully' as status,
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE name = 'materials';

-- Show all policies for the materials bucket
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%materials%';
