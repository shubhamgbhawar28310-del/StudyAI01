-- Force Supabase to Refresh Schema Cache
-- Run this in Supabase SQL Editor

-- Method 1: Send reload notification to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Make a small change to force cache update
COMMENT ON TABLE user_settings IS 'User settings and preferences - Updated';

-- Method 3: Grant permissions again (forces cache refresh)
GRANT ALL ON user_settings TO authenticated;
-- Verify everything is correct
SELECT 'Cache refresh triggered! Wait 30 seconds then try saving settings again.' as status;

-- Show table info
SELECT 
  'user_settings' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'user_settings';
