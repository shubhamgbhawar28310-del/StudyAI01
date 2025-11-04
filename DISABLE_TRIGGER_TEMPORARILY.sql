-- =====================================================
-- TEMPORARY FIX: Disable the problematic trigger
-- =====================================================
-- This will let you create events immediately
-- We'll fix the trigger properly after

-- Step 1: Disable the trigger
DROP TRIGGER IF EXISTS trigger_sync_schedule_event ON schedule_events;

-- Step 2: Clean up the sync queue
DELETE FROM google_calendar_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY event_id 
                   ORDER BY created_at DESC
               ) AS rn
        FROM google_calendar_sync_queue
    ) t WHERE t.rn > 1
);

-- Step 3: Standardize event types
UPDATE google_calendar_sync_queue
SET event_type = 'schedule_event'
WHERE event_type = 'schedule_events';

-- Done!
SELECT '✅ Trigger disabled. You can now create events!' as result;
SELECT '⚠️ Note: Events will NOT sync to Google Calendar until trigger is re-enabled' as warning;
SELECT '📝 After creating events successfully, run ENABLE_TRIGGER_FIXED.sql to re-enable sync' as next_step;
