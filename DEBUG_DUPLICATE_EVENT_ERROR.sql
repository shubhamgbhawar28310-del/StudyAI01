-- Debug script to check for duplicate events and understand the error

-- 1. Check if there are any duplicate IDs in schedule_events
SELECT id, COUNT(*) as count
FROM schedule_events
GROUP BY id
HAVING COUNT(*) > 1;

-- 2. Check recent events to see if there are duplicates by content
SELECT id, user_id, title, start_time, end_time, created_at
FROM schedule_events
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check if there's a unique constraint on the ID column
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'schedule_events'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- 4. Check for any triggers on schedule_events that might be causing issues
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'schedule_events';
