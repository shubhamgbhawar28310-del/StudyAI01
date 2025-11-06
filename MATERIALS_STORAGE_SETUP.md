# Materials Storage Setup Guide

This guide will help you set up Supabase Storage for the Materials Manager feature.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `materials`
   - **Public bucket**: ✅ Enable (for easy file access)
   - **File size limit**: 100MB (optional)
   - **Allowed MIME types**: Leave empty or specify: `image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,text/*`

## Step 2: Set Up Storage Policies (RLS)

Go to **Storage → Policies** and create the following policies for the `materials` bucket:

### Policy 1: Allow Users to Upload Their Own Files

```sql
-- Policy name: Users can upload their own materials
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Users can upload their own materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow Users to View Their Own Files

```sql
-- Policy name: Users can view their own materials
-- Operation: SELECT
-- Target roles: authenticated, anon (if public access needed)

CREATE POLICY "Users can view their own materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow Users to Delete Their Own Files

```sql
-- Policy name: Users can delete their own materials
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete their own materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow Users to Update Their Own Files

```sql
-- Policy name: Users can update their own materials
-- Operation: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update their own materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Configure CORS (if needed)

If you're accessing files from a different domain, configure CORS:

1. Go to **Storage → Configuration**
2. Add your domain to allowed origins
3. Or use the SQL editor:

```sql
-- Allow CORS for your domain
INSERT INTO storage.cors (bucket_id, allowed_origins, allowed_methods, allowed_headers)
VALUES (
  'materials',
  ARRAY['https://aivyapp.vercel.app', 'http://localhost:5173'],
  ARRAY['GET', 'POST', 'PUT', 'DELETE'],
  ARRAY['*']
);
```

## Step 4: Test the Setup

Run this test in your Supabase SQL Editor:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'materials';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## Step 5: Update Your Application

The MaterialsManager component has been updated to use Supabase Storage automatically. No additional configuration needed in your app code.

## Storage Structure

Files will be organized as:
```
materials/
  └── {userId}/
      ├── {materialId}-file1.pdf
      ├── {materialId}-file2.docx
      └── {materialId}-image.png
```

## Monitoring Usage

- Go to **Storage → materials** to view all uploaded files
- Check **Settings → Usage** to monitor storage quota
- Supabase Free Tier: 1GB storage included

## Troubleshooting

### Upload fails with "new row violates row-level security policy"
- Check that RLS policies are correctly set up
- Verify the user is authenticated
- Ensure the file path starts with the user's ID

### Files not accessible
- Check if bucket is public or policies allow SELECT
- Verify CORS settings if accessing from browser
- Check file path format: `{userId}/{materialId}-{filename}`

### Storage quota exceeded
- Upgrade your Supabase plan
- Implement file size limits in the app
- Clean up old/unused files

## Migration from IndexedDB

If you have existing files in IndexedDB, they will remain accessible as a fallback. New uploads will go to Supabase Storage. To fully migrate:

1. Users can re-upload their important files
2. Or implement a migration script to upload IndexedDB files to Supabase
3. Clear IndexedDB after successful migration

## Security Notes

- Files are stored under user-specific folders for privacy
- RLS policies ensure users can only access their own files
- Consider using signed URLs for sensitive documents
- Implement virus scanning for production use
- Set appropriate file size limits to prevent abuse
