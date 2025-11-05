-- Check if events actually have Google Calendar IDs
-- User ID: 54a35c8f-663f-4a0b-a6cb-1fa65177a6b4

-- 1. Check schedule_events table - do they have google_event_id?
SELECT 
  id,
  title,
  start_time,
  synced_to_google,
  google_event_id,
  last_synced_at,
  created_at
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC;

-- 2. Count events with and without Google IDs
SELECT 
  CASE 
    WHEN google_event_id IS NOT NULL THEN 'Has Google ID (synced)'
    ELSE 'No Google ID (not synced)'
  END as status,
  COUNT(*) as count
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
GROUP BY status;

-- 3. Check the completed queue items - what was the result?
SELECT 
  event_id,
  event_data->>'summary' as title,
  operation,
  status,
  error_message,
  processed_at
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
  AND status = 'completed'
ORDER BY processed_at DESC
LIMIT 10;

-- 4. Check worker logs - look for errors
SELECT 
  event_data->>'summary' as title,
  status,
  error_message,
  retry_count
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC;
