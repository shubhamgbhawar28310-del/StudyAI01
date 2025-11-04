-- =====================================================
-- Re-enable the trigger with proper fix
-- Run this AFTER you've successfully created events
-- =====================================================

-- Step 1: Create the fixed trigger function
CREATE OR REPLACE FUNCTION sync_schedule_event_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
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
    
    -- Use INSERT ... ON CONFLICT to handle duplicates gracefully
    INSERT INTO google_calendar_sync_queue (
        user_id,
        event_type,
        event_id,
        operation,
        event_data,
        status
    ) VALUES (
        v_user_id,
        'schedule_event',
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
        ),
        'pending'
    )
    ON CONFLICT (event_type, event_id) 
    DO UPDATE SET
        operation = CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
        event_data = EXCLUDED.event_data,
        status = 'pending',
        created_at = NOW(),
        retry_count = 0;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Error syncing to Google Calendar: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Re-enable the trigger
CREATE TRIGGER trigger_sync_schedule_event
    AFTER INSERT OR UPDATE OF title, start_time, end_time, description
    ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION sync_schedule_event_to_google();

-- Step 3: Update CHECK constraint
ALTER TABLE google_calendar_sync_queue 
DROP CONSTRAINT IF EXISTS google_calendar_sync_queue_event_type_check;

ALTER TABLE google_calendar_sync_queue 
ADD CONSTRAINT google_calendar_sync_queue_event_type_check 
CHECK (event_type IN ('schedule_event', 'task'));

-- Done!
SELECT '✅ Trigger re-enabled with proper duplicate handling!' as result;
SELECT '🔄 Events will now sync to Google Calendar automatically' as info;
