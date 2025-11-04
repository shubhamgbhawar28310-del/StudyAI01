-- Check Google Calendar Sync Status
-- Run this in Supabase SQL Editor to diagnose sync issues

-- 1. Check if there are any events in the sync queue
SELECT 
  'Sync Queue Status' as check_name,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_event
FROM google_calendar_sync_queue
GROUP BY status;

-- 2. Check recent sync queue entries
SELECT 
  'Recent Queue Entries' as check_name,
  id,
  user_id,
  event_type,
  operation,
  status,
  error_message,
  retry_count,
  created_at,
  processed_at
FROM google_calendar_sync_queue
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if user has Google Calendar connected
SELECT 
  'User Calendar Connection' as check_name,
  user_id,
  google_calendar_connected,
  google_calendar_email,
  google_calendar_token_expires_at,
  CASE 
    WHEN google_calendar_token_expires_at < NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END as token_status
FROM user_settings
WHERE google_calendar_connected = true;

-- 4. Check schedule events that should be synced
SELECT 
  'Events Not Synced' as check_name,
  id,
  title,
  start_time,
  end_time,
  synced_to_google,
  google_event_id,
  created_at
FROM schedule_events
WHERE synced_to_google = false
  OR synced_to_google IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if events are being added to queue (trigger working?)
SELECT 
  'Queue vs Events Comparison' as check_name,
  (SELECT COUNT(*) FROM schedule_events WHERE synced_to_google = false OR synced_to_google IS NULL) as unsynced_events,
  (SELECT COUNT(*) FROM google_calendar_sync_queue WHERE status = 'pending') as pending_in_queue,
  (SELECT COUNT(*) FROM google_calendar_sync_queue WHERE status = 'completed') as completed_syncs,
  (SELECT COUNT(*) FROM google_calendar_sync_queue WHERE status = 'failed') as failed_syncs;

-- 6. Check for failed syncs with error messages
SELECT 
  'Failed Syncs' as check_name,
  id,
  event_type,
  operation,
  error_message,
  retry_count,
  created_at
FROM google_calendar_sync_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check if trigger exists
SELECT 
  'Database Triggers' as check_name,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%google%calendar%'
   OR trigger_name LIKE '%sync%queue%';
