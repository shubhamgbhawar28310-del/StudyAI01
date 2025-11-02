-- Fix CORS settings for Supabase Storage
-- Run this in your Supabase SQL Editor

-- First, check current bucket settings
SELECT * FROM storage.buckets WHERE id = 'music';

-- Update bucket to ensure it's public and has proper CORS
UPDATE storage.buckets 
SET 
  public = true,
  avif_autodetection = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
WHERE id = 'music';

-- Check if the update worked
SELECT * FROM storage.buckets WHERE id = 'music';