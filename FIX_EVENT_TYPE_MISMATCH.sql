-- =====================================================
-- FIX: Event Type Mismatch in Sync Queue
-- =====================================================
-- Problem: Some entries use 'schedule_event' and others use 'schedule_events'
-- This causes the UNIQUE constraint to allow duplicates!

-- Step 1: Check the current state
SELECT 
    event_type,
    COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY event_type;

-- Step 2: Standardize all to 'schedule_event' (singular)
UPDATE google_calendar_sync_queue
SET event_type = 'schedule_event'
WHERE event_type = 'schedule_events';

-- Step 3: Now clean up any duplicates that were hidden by the mismatch
DELETE FROM google_calendar_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY event_type, event_id 
                   ORDER BY created_at DESC
               ) AS rn
        FROM google_calendar_sync_queue
    ) t WHERE t.rn > 1
);

-- Step 4: Update the CHECK constraint to only allow singular form
ALTER TABLE google_calendar_sync_queue 
DROP CONSTRAINT IF EXISTS google_calendar_sync_queue_event_type_check;

ALTER TABLE google_calendar_sync_queue 
ADD CONSTRAINT google_calendar_sync_queue_event_type_check 
CHECK (event_type IN ('schedule_event', 'task'));

-- Step 5: Update the trigger to use consistent naming
CREATE OR REPLACE FUNCTION sync_schedule_event_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    v_user_id := NEW.user_id;
    
    -- Check if user has Google Calendar connected
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = v_user_id;
    
    -- If not connected, skip sync
    IF v_connected IS NULL OR v_connected = false THEN
        RETURN NEW;
    END IF;
    
    NEW.synced_to_google := false;
    
    -- Check if entry already exists (using singular 'schedule_event')
    SELECT id INTO v_existing_id
    FROM google_calendar_sync_queue
    WHERE event_type = 'schedule_event'
    AND event_id = NEW.id;
    
    -- Update if exists, insert if not
    IF v_existing_id IS NOT NULL THEN
        UPDATE google_calendar_sync_queue
        SET 
            operation = CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            event_data = jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session from StudyAI'),
                'start', jsonb_build_object('dateTime', NEW.start_time, 'timeZone', 'UTC'),
                'end', jsonb_build_object('dateTime', NEW.end_time, 'timeZone', 'UTC'),
                'reminders', jsonb_build_object(
                    'useDefault', false,
                    'overrides', jsonb_build_array(
                        jsonb_build_object('method', 'popup', 'minutes', 10)
                    )
                )
            ),
            status = 'pending',
            created_at = NOW(),
            retry_count = 0
        WHERE id = v_existing_id;
    ELSE
        -- Insert new entry (using singular 'schedule_event')
        INSERT INTO google_calendar_sync_queue (
            user_id,
            event_type,
            event_id,
            operation,
            event_data
        ) VALUES (
            v_user_id,
            'schedule_event',  -- Always use singular form
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session from StudyAI'),
                'start', jsonb_build_object('dateTime', NEW.start_time, 'timeZone', 'UTC'),
                'end', jsonb_build_object('dateTime', NEW.end_time, 'timeZone', 'UTC'),
                'reminders', jsonb_build_object(
                    'useDefault', false,
                    'overrides', jsonb_build_array(
                        jsonb_build_object('method', 'popup', 'minutes', 10)
                    )
                )
            )
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If we still get a unique violation, just ignore it
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Error syncing to Google Calendar: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update the deletion trigger too
CREATE OR REPLACE FUNCTION sync_deletion_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
BEGIN
    -- Check if user has Google Calendar connected
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = OLD.user_id;
    
    -- If connected and event was synced, queue deletion
    IF v_connected AND OLD.google_event_id IS NOT NULL THEN
        INSERT INTO google_calendar_sync_queue (
            user_id,
            event_type,
            event_id,
            operation,
            event_data
        ) VALUES (
            OLD.user_id,
            'schedule_event',  -- Use singular form consistently
            OLD.id,
            'delete',
            jsonb_build_object('google_event_id', OLD.google_event_id)
        )
        ON CONFLICT (event_type, event_id) DO UPDATE
        SET operation = 'delete',
            event_data = EXCLUDED.event_data,
            status = 'pending',
            created_at = NOW();
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Fix RLS policies
DROP POLICY IF EXISTS "Users can view their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can insert their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can update their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to view sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to insert sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to update sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to delete sync queue" ON google_calendar_sync_queue;

CREATE POLICY "Users can manage their sync queue"
    ON google_calendar_sync_queue FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 8: Verify the fix
SELECT 
    'After Fix - Event Types' as check_name,
    event_type,
    COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY event_type;

SELECT 
    'After Fix - Duplicates' as check_name,
    event_type,
    event_id,
    COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY event_type, event_id
HAVING COUNT(*) > 1;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed event_type mismatch!';
    RAISE NOTICE '📝 Standardized all entries to use "schedule_event" (singular)';
    RAISE NOTICE '🧹 Cleaned up duplicate entries';
    RAISE NOTICE '🔧 Updated triggers to use consistent naming';
    RAISE NOTICE '🧪 Try creating an event now - it should work!';
END $$;
