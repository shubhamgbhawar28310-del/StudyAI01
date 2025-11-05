-- Check which events are not synced to Google Calendar
-- Run this to see what will be synced when you click the sync button

-- 1. Check unsynced schedule events
SELECT 
  'SCHEDULE_EVENTS' as type,
  COUNT(*) as total_unsynced
FROM schedule_events
WHERE (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL;

-- 2. Check unsynced tasks with deadlines
SELECT 
  'TASKS' as type,
  COUNT(*) as total_unsynced
FROM tasks
WHERE deadline IS NOT NULL
  AND (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL;

-- 3. List specific unsynced schedule events
SELECT 
  id,
  title,
  start_time,
  end_time,
  synced_to_google,
  google_event_id,
  created_at
FROM schedule_events
WHERE (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check current sync queue status
SELECT 
  status,
  COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY status;
