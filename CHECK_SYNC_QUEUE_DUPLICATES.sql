-- Quick diagnostic to check for sync queue issues

-- 1. Check for duplicate entries
SELECT 
    event_type,
    event_id,
    COUNT(*) as duplicate_count,
    array_agg(id) as queue_ids,
    array_agg(status) as statuses
FROM google_calendar_sync_queue
GROUP BY event_type, event_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Check sync queue status breakdown
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM google_calendar_sync_queue
GROUP BY status;

-- 3. Check recent sync queue entries
SELECT 
    id,
    event_type,
    event_id,
    operation,
    status,
    retry_count,
    created_at,
    error_message
FROM google_calendar_sync_queue
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check if user has Google Calendar connected
SELECT 
    user_id,
    google_calendar_connected,
    google_calendar_email
FROM user_settings
WHERE user_id = auth.uid();

-- 5. Check for events that should be in sync queue but aren't
SELECT 
    se.id,
    se.title,
    se.start_time,
    se.synced_to_google,
    CASE 
        WHEN sq.id IS NULL THEN 'NOT IN QUEUE'
        ELSE 'IN QUEUE'
    END as queue_status
FROM schedule_events se
LEFT JOIN google_calendar_sync_queue sq 
    ON sq.event_id = se.id AND sq.event_type = 'schedule_event'
WHERE se.user_id = auth.uid()
ORDER BY se.created_at DESC
LIMIT 10;
