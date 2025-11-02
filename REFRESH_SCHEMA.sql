-- Quick Schema Refresh
-- Run this in Supabase SQL Editor to refresh the schema cache

-- Method 1: Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';

-- Method 2: Show current table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Method 3: Verify the achievements column exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'user_settings' 
  AND column_name = 'achievements'
) as achievements_column_exists;

-- If the above returns 'false', run FIX_SETTINGS_SCHEMA.sql instead

SELECT 'Schema refresh requested. Wait 30 seconds then try again.' as message;
