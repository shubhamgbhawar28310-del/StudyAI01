-- Script to clean up duplicate events and reset the schedule_events table if needed

-- STEP 1: Check for duplicate IDs (should return 0 rows if everything is fine)
SELECT id, COUNT(*) as count
FROM schedule_events
GROUP BY id
HAVING COUNT(*) > 1;

-- STEP 2: Check for duplicate events by content (same title, start time, end time)
SELECT 
    title, 
    start_time, 
    end_time, 
    COUNT(*) as count,
    array_agg(id) as event_ids
FROM schedule_events
GROUP BY title, start_time, end_time
HAVING COUNT(*) > 1;

-- STEP 3: If you found duplicates, you can delete them (CAREFUL!)
-- This keeps the oldest event and deletes newer duplicates
-- UNCOMMENT ONLY IF YOU WANT TO DELETE DUPLICATES:

/*
DELETE FROM schedule_events
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY title, start_time, end_time 
                   ORDER BY created_at ASC
               ) AS rn
        FROM schedule_events
    ) t
    WHERE t.rn > 1
);
*/

-- STEP 4: Verify the cleanup worked
SELECT COUNT(*) as total_events FROM schedule_events;

-- STEP 5: Check recent events to make sure everything looks good
SELECT 
    id, 
    title, 
    start_time, 
    end_time, 
    created_at,
    status
FROM schedule_events
ORDER BY created_at DESC
LIMIT 20;

-- STEP 6: If you want to completely reset (DELETE ALL EVENTS - USE WITH CAUTION!)
-- UNCOMMENT ONLY IF YOU WANT TO START FRESH:

/*
-- Replace 'YOUR_USER_ID' with your actual user ID
DELETE FROM schedule_events 
WHERE user_id = 'YOUR_USER_ID';

-- Verify deletion
SELECT COUNT(*) as remaining_events 
FROM schedule_events 
WHERE user_id = 'YOUR_USER_ID';
*/
