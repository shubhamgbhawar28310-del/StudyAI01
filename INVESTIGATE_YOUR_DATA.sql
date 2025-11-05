-- Let's see what's actually in your database
-- User ID: 54a35c8f-663f-4a0b-a6cb-1fa65177a6b4

-- 1. Do you have ANY schedule events?
SELECT 
  'Total schedule_events:' as info,
  COUNT(*) as count
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4';

-- 2. Show me ALL your events (regardless of sync status)
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
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check sync status breakdown
SELECT 
  CASE 
    WHEN synced_to_google = true AND google_event_id IS NOT NULL THEN 'Fully Synced'
    WHEN synced_to_google = true AND google_event_id IS NULL THEN 'Marked synced but no ID'
    WHEN synced_to_google = false OR synced_to_google IS NULL THEN 'Not synced'
    ELSE 'Unknown'
  END as sync_status,
  COUNT(*) as count
FROM schedule_events
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
GROUP BY sync_status;

-- 4. Check if events are already in the queue
SELECT 
  'Already in queue:' as info,
  COUNT(*) as count
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4';

-- 5. Show queue details
SELECT 
  event_type,
  operation,
  status,
  event_data->>'summary' as title,
  created_at,
  processed_at,
  error_message
FROM google_calendar_sync_queue
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if columns exist and their values
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'schedule_events'
  AND column_name IN ('synced_to_google', 'google_event_id', 'last_synced_at')
ORDER BY column_name;
