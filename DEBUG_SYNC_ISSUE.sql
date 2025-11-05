-- Debug script to check why events aren't syncing

-- 1. Check if schedule_events table has the required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'schedule_events'
  AND column_name IN ('synced_to_google', 'google_event_id', 'last_synced_at')
ORDER BY column_name;

-- 2. Check if tasks table has the required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('synced_to_google', 'google_event_id', 'last_synced_at', 'deadline')
ORDER BY column_name;

-- 3. Check actual data in schedule_events
SELECT 
  id,
  title,
  start_time,
  synced_to_google,
  google_event_id,
  created_at
FROM schedule_events
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if google_calendar_sync_queue table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'google_calendar_sync_queue'
) as queue_table_exists;

-- 5. Check user's Google Calendar connection
SELECT 
  user_id,
  google_calendar_connected,
  google_calendar_email,
  google_calendar_token IS NOT NULL as has_token,
  google_calendar_refresh_token IS NOT NULL as has_refresh_token
FROM user_settings
LIMIT 1;
