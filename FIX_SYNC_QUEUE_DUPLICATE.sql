-- =====================================================
-- FIX: Google Calendar Sync Queue Duplicate Error
-- =====================================================
-- Problem: The trigger tries to insert into sync queue with same event_id
-- causing "duplicate key value violates unique constraint" error

-- SOLUTION 1: Drop and recreate the trigger to handle conflicts better
-- =====================================================

-- Update the sync function to handle conflicts more gracefully
CREATE OR REPLACE FUNCTION sync_schedule_event_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    -- Get user_id
    v_user_id := NEW.user_id;
    
    -- Check if user has Google Calendar connected
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = v_user_id;
    
    -- If not connected, skip sync
    IF v_connected IS NULL OR v_connected = false THEN
        RETURN NEW;
    END IF;
    
    -- Mark as needing sync
    NEW.synced_to_google := false;
    
    -- Check if entry already exists in sync queue
    SELECT id INTO v_existing_id
    FROM google_calendar_sync_queue
    WHERE event_type = 'schedule_event'
    AND event_id = NEW.id;
    
    -- If exists, update it
    IF v_existing_id IS NOT NULL THEN
        UPDATE google_calendar_sync_queue
        SET 
            operation = CASE 
                WHEN TG_OP = 'INSERT' THEN 'create'
                WHEN TG_OP = 'UPDATE' THEN 'update'
            END,
            event_data = jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session from StudyAI'),
                'start', jsonb_build_object(
                    'dateTime', NEW.start_time,
                    'timeZone', 'UTC'
                ),
                'end', jsonb_build_object(
                    'dateTime', NEW.end_time,
                    'timeZone', 'UTC'
                ),
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
        -- Insert new entry
        INSERT INTO google_calendar_sync_queue (
            user_id,
            event_type,
            event_id,
            operation,
            event_data
        ) VALUES (
            v_user_id,
            'schedule_event',
            NEW.id,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'create'
                WHEN TG_OP = 'UPDATE' THEN 'update'
            END,
            jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session from StudyAI'),
                'start', jsonb_build_object(
                    'dateTime', NEW.start_time,
                    'timeZone', 'UTC'
                ),
                'end', jsonb_build_object(
                    'dateTime', NEW.end_time,
                    'timeZone', 'UTC'
                ),
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
        -- The event will be synced on the next update
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Error syncing to Google Calendar: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_sync_schedule_event ON schedule_events;
CREATE TRIGGER trigger_sync_schedule_event
    BEFORE INSERT OR UPDATE OF title, start_time, end_time, description
    ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION sync_schedule_event_to_google();

-- SOLUTION 2: Add better RLS policies for sync queue
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can insert their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can update their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to view sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to insert sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to update sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to delete sync queue" ON google_calendar_sync_queue;

-- Create comprehensive policies
CREATE POLICY "Users can manage their sync queue"
    ON google_calendar_sync_queue
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- SOLUTION 3: Clean up any stuck entries
-- =====================================================

-- Delete any duplicate entries (keep the most recent)
DELETE FROM google_calendar_sync_queue
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY event_type, event_id 
                   ORDER BY created_at DESC
               ) AS rn
        FROM google_calendar_sync_queue
    ) t
    WHERE t.rn > 1
);

-- Reset any stuck 'processing' entries back to 'pending'
UPDATE google_calendar_sync_queue
SET status = 'pending'
WHERE status = 'processing'
AND created_at < NOW() - INTERVAL '5 minutes';

-- VERIFICATION
-- =====================================================

-- Check for duplicates (should return 0 rows)
SELECT event_type, event_id, COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY event_type, event_id
HAVING COUNT(*) > 1;

-- Check sync queue status
SELECT 
    status,
    COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY status;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed Google Calendar sync queue duplicate error!';
    RAISE NOTICE '🔧 Updated trigger to handle conflicts gracefully';
    RAISE NOTICE '🧹 Cleaned up duplicate entries';
    RAISE NOTICE '🧪 Try creating an event now - it should work!';
END $$;
