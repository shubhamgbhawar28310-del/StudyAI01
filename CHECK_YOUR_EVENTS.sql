-- Check your specific events and sync status
-- User ID: 54a35c8f-663f-4a0b-a6cb-1fa65177a6b4

-- 1. Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'schedule_events'
  AND column_name IN ('synced_to_google', 'google_event_id', 'last_synced_at')
ORDER BY column_name;

-- 2. Check your schedule events
SELECT 
  id,
  title,
  start_time,
  end_time,
  synced_to_google,
  google_event_id,
  created_at
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC;

-- 3. Count unsynced events
SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN synced_to_google = true AND google_event_id IS NOT NULL THEN 1 END) as synced,
  COUNT(CASE WHEN synced_to_google IS NULL OR synced_to_google = false OR google_event_id IS NULL THEN 1 END) as unsynced
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4';

-- 4. Check sync queue
SELECT 
  event_type,
  operation,
  status,
  event_data->>'summary' as title,
  created_at,
  error_message
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if google_calendar_sync_queue table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'google_calendar_sync_queue'
) as queue_exists;
