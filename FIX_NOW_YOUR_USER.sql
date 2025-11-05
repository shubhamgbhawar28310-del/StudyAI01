-- COMPLETE FIX FOR YOUR USER
-- User ID: 54a35c8f-663f-4a0b-a6cb-1fa65177a6b4

-- Step 1: Add columns if they don't exist
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Step 2: Check what events need syncing
SELECT 
  'Events to sync:' as info,
  COUNT(*) as count
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
  AND (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL;

-- Step 3: Queue all your unsynced events
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
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
  AND (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL
ON CONFLICT (event_type, event_id) DO NOTHING;

-- Step 4: Verify what was queued
SELECT 
  'Queued for sync:' as status,
  COUNT(*) as count
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
  AND status = 'pending';

-- Step 5: Show the queued events
SELECT 
  event_data->>'summary' as event_title,
  status,
  created_at
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
  AND status = 'pending'
ORDER BY created_at DESC;

-- SUCCESS! Now do ONE of these:
-- Option A: Click "Sync to Calendar" button in your app
-- Option B: Go to Supabase Dashboard → Edge Functions → google-calendar-worker → Click "Invoke"
