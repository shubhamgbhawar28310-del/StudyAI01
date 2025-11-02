-- Fix the file_path in your songs table
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT id, title, file_path, public_url FROM songs;

-- Update the file_path to remove the full URL and keep only the path
-- Replace the full URL with just the file path
UPDATE songs 
SET file_path = REPLACE(
  file_path, 
  'https://crdqpioymuvnzhtgrenj.supabase.co/storage/v1/object/public/music/', 
  ''
)
WHERE file_path LIKE 'https://crdqpioymuvnzhtgrenj.supabase.co/storage/v1/object/public/music/%';

-- Also make sure public_url is correct
UPDATE songs 
SET public_url = 'https://crdqpioymuvnzhtgrenj.supabase.co/storage/v1/object/public/music/' || file_path
WHERE public_url IS NULL OR public_url = '';

-- Check the results
SELECT id, title, file_path, public_url FROM songs;