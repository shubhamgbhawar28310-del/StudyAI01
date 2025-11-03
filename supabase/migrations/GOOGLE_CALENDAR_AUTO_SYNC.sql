-- =====================================================
-- GOOGLE CALENDAR AUTO-SYNC TRIGGERS
-- Automatically sync events to Google Calendar when created/updated
-- =====================================================

-- Function to sync schedule event to Google Calendar
CREATE OR REPLACE FUNCTION sync_schedule_event_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
BEGIN
    -- Get user_id
    v_user_id := NEW.user_id;
    
    -- Check if user has Google Calendar connected
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = v_user_id;
    
    -- If connected, trigger sync via webhook/notification
    IF v_connected THEN
        -- Mark as needing sync
        NEW.synced_to_google := false;
        
        -- Insert notification for background sync worker
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
        )
        ON CONFLICT (event_type, event_id) 
        DO UPDATE SET
            operation = EXCLUDED.operation,
            event_data = EXCLUDED.event_data,
            created_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync task to Google Calendar
CREATE OR REPLACE FUNCTION sync_task_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
BEGIN
    -- Only sync if task has a deadline
    IF NEW.deadline IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get user_id
    v_user_id := NEW.user_id;
    
    -- Check if user has Google Calendar connected
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = v_user_id;
    
    -- If connected, trigger sync
    IF v_connected THEN
        -- Mark as needing sync
        NEW.synced_to_google := false;
        
        -- Insert notification for background sync worker
        INSERT INTO google_calendar_sync_queue (
            user_id,
            event_type,
            event_id,
            operation,
            event_data
        ) VALUES (
            v_user_id,
            'task',
            NEW.id,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'create'
                WHEN TG_OP = 'UPDATE' THEN 'update'
            END,
            jsonb_build_object(
                'summary', '✅ ' || NEW.title,
                'description', COALESCE(NEW.description, 'Task deadline from StudyAI'),
                'start', jsonb_build_object(
                    'dateTime', NEW.deadline,
                    'timeZone', 'UTC'
                ),
                'end', jsonb_build_object(
                    'dateTime', NEW.deadline + INTERVAL '1 hour',
                    'timeZone', 'UTC'
                ),
                'reminders', jsonb_build_object(
                    'useDefault', false,
                    'overrides', jsonb_build_array(
                        jsonb_build_object('method', 'popup', 'minutes', 10),
                        jsonb_build_object('method', 'popup', 'minutes', 60)
                    )
                )
            )
        )
        ON CONFLICT (event_type, event_id) 
        DO UPDATE SET
            operation = EXCLUDED.operation,
            event_data = EXCLUDED.event_data,
            created_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle deletions
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
            TG_TABLE_NAME::TEXT,
            OLD.id,
            'delete',
            jsonb_build_object('google_event_id', OLD.google_event_id)
        );
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create sync queue table
CREATE TABLE IF NOT EXISTS google_calendar_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('schedule_event', 'task', 'schedule_events', 'tasks')),
    event_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    event_data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    UNIQUE(event_type, event_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON google_calendar_sync_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON google_calendar_sync_queue(user_id);

-- Enable RLS
ALTER TABLE google_calendar_sync_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view their own sync queue"
    ON google_calendar_sync_queue FOR SELECT
    USING (auth.uid() = user_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_sync_schedule_event ON schedule_events;
DROP TRIGGER IF EXISTS trigger_sync_task ON tasks;
DROP TRIGGER IF EXISTS trigger_sync_schedule_event_delete ON schedule_events;
DROP TRIGGER IF EXISTS trigger_sync_task_delete ON tasks;

-- Create triggers for schedule_events
CREATE TRIGGER trigger_sync_schedule_event
    BEFORE INSERT OR UPDATE OF title, start_time, end_time, description
    ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION sync_schedule_event_to_google();

CREATE TRIGGER trigger_sync_schedule_event_delete
    AFTER DELETE ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION sync_deletion_to_google();

-- Create triggers for tasks
CREATE TRIGGER trigger_sync_task
    BEFORE INSERT OR UPDATE OF title, deadline, description
    ON tasks
    FOR EACH ROW
    WHEN (NEW.deadline IS NOT NULL)
    EXECUTE FUNCTION sync_task_to_google();

CREATE TRIGGER trigger_sync_task_delete
    AFTER DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION sync_deletion_to_google();

-- Function to process sync queue (call this from a cron job or Edge Function)
CREATE OR REPLACE FUNCTION process_google_calendar_sync_queue()
RETURNS TABLE (
    processed_count INTEGER,
    failed_count INTEGER
) AS $$
DECLARE
    v_processed INTEGER := 0;
    v_failed INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Process pending items (limit to 50 per run to avoid timeouts)
    FOR v_record IN 
        SELECT * FROM google_calendar_sync_queue
        WHERE status = 'pending'
        AND retry_count < 3
        ORDER BY created_at
        LIMIT 50
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Mark as processing
        UPDATE google_calendar_sync_queue
        SET status = 'processing'
        WHERE id = v_record.id;
        
        -- Note: Actual sync happens via Edge Function
        -- This just marks items for processing
        
        v_processed := v_processed + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_processed, v_failed;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Google Calendar auto-sync triggers created!';
    RAISE NOTICE 'Events will automatically sync when created/updated/deleted';
    RAISE NOTICE 'Sync queue table created for reliable background processing';
END $$;
