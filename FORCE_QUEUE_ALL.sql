-- FORCE QUEUE ALL EVENTS (ignoring sync status)
-- User ID: 54a35c8f-663f-4a0b-a6cb-1fa65177a6b4

-- First, let's see what we have
SELECT 
  id,
  title,
  start_time,
  synced_to_google,
  google_event_id
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC;

-- Now force queue EVERYTHING (even if marked as synced)
-- This will re-sync all events
INSERT INTO google_calendar_sync_queue (
  user_id,
  event_type,
  event_id,
  operation,
  event_data,
  status
)
SELECT 
  user_id,
  'schedule_event',
  id,
  CASE 
    WHEN google_event_id IS NOT NULL THEN 'update'
    ELSE 'create'
  END,
  jsonb_build_object(
    'summary', '📚 ' || title,
    'description', COALESCE(description, 'Study session from StudyAI'),
    'start', jsonb_build_object(
      'dateTime', start_time,
      'timeZone', 'UTC'
    ),
    'end', jsonb_build_object(
      'dateTime', end_time,
      'timeZone', 'UTC'
    ),
    'reminders', jsonb_build_object(
      'useDefault', false,
      'overrides', jsonb_build_array(
        jsonb_build_object('method', 'popup', 'minutes', 10)
      )
    )
  ),
  'pending'
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ON CONFLICT (event_type, event_id) 
DO UPDATE SET
  operation = EXCLUDED.operation,
  event_data = EXCLUDED.event_data,
  status = 'pending',
  created_at = NOW();

-- Check what was queued
SELECT 
  'Total queued:' as info,
  COUNT(*) as count
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
  AND status = 'pending';

-- Show the queued events
SELECT 
  event_data->>'summary' as title,
  operation,
  status,
  created_at
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC;
