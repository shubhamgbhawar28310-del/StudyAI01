-- MANUAL FIX: Queue all unsynced events to Google Calendar
-- Replace 'YOUR_USER_ID' with your actual user ID
-- Find your user ID by running: SELECT auth.uid();

-- Step 1: Add missing columns if needed
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Step 2: Queue all unsynced schedule events
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
  'create',
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
WHERE (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL
ON CONFLICT (event_type, event_id) DO NOTHING;

-- Step 3: Check what was queued
SELECT 
  'Queued Events' as status,
  COUNT(*) as count
FROM google_calendar_sync_queue
WHERE status = 'pending';

-- Step 4: See the queued events
SELECT 
  event_type,
  event_data->>'summary' as title,
  status,
  created_at
FROM google_calendar_sync_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Now trigger the worker function manually
-- Go to Supabase Dashboard → Edge Functions → google-calendar-worker → Invoke
-- OR click "Sync to Calendar" button in your app
