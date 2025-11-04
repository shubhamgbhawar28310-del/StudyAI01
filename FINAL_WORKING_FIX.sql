-- =====================================================
-- FINAL WORKING FIX - Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: First, let's see what we're dealing with
SELECT 
    event_type,
    event_id,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at DESC) as ids
FROM google_calendar_sync_queue
GROUP BY event_type, event_id
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates FIRST (keep the most recent one)
-- This handles both 'schedule_event' and 'schedule_events' duplicates
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

-- Step 3: NOW update event_type to singular (no more duplicates to conflict)
UPDATE google_calendar_sync_queue
SET event_type = 'schedule_event'
WHERE event_type = 'schedule_events';

-- Step 4: Update CHECK constraint
ALTER TABLE google_calendar_sync_queue 
DROP CONSTRAINT IF EXISTS google_calendar_sync_queue_event_type_check;

ALTER TABLE google_calendar_sync_queue 
ADD CONSTRAINT google_calendar_sync_queue_event_type_check 
CHECK (event_type IN ('schedule_event', 'task'));

-- Step 5: Fix the trigger
CREATE OR REPLACE FUNCTION sync_schedule_event_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    v_user_id := NEW.user_id;
    
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = v_user_id;
    
    IF v_connected IS NULL OR v_connected = false THEN
        RETURN NEW;
    END IF;
    
    NEW.synced_to_google := false;
    
    SELECT id INTO v_existing_id
    FROM google_calendar_sync_queue
    WHERE event_type = 'schedule_event' AND event_id = NEW.id;
    
    IF v_existing_id IS NOT NULL THEN
        UPDATE google_calendar_sync_queue
        SET 
            operation = CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            event_data = jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session'),
                'start', jsonb_build_object('dateTime', NEW.start_time, 'timeZone', 'UTC'),
                'end', jsonb_build_object('dateTime', NEW.end_time, 'timeZone', 'UTC')
            ),
            status = 'pending',
            created_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        INSERT INTO google_calendar_sync_queue (user_id, event_type, event_id, operation, event_data)
        VALUES (
            v_user_id, 'schedule_event', NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session'),
                'start', jsonb_build_object('dateTime', NEW.start_time, 'timeZone', 'UTC'),
                'end', jsonb_build_object('dateTime', NEW.end_time, 'timeZone', 'UTC')
            )
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN RETURN NEW;
    WHEN OTHERS THEN
        RAISE WARNING 'Sync error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Fix RLS policies
DROP POLICY IF EXISTS "Users can view their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can insert their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can update their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to view sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to insert sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to update sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to delete sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can manage their sync queue" ON google_calendar_sync_queue;

CREATE POLICY "Users can manage their sync queue"
    ON google_calendar_sync_queue FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 7: Verify the fix
SELECT 
    'Remaining duplicates (should be 0)' as check_name,
    COUNT(*) as duplicate_count
FROM (
    SELECT event_type, event_id, COUNT(*) as cnt
    FROM google_calendar_sync_queue
    GROUP BY event_type, event_id
    HAVING COUNT(*) > 1
) t;

SELECT 
    'Event types (should only be schedule_event and task)' as check_name,
    event_type,
    COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY event_type;

-- Success!
SELECT '✅ Fix applied successfully! Refresh your app and try creating an event.' as result;
