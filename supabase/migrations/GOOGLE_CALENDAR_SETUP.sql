-- =====================================================
-- GOOGLE CALENDAR INTEGRATION SETUP
-- =====================================================

-- 1. Update user_settings table with Google Calendar fields
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMPTZ;

-- 2. Add Google Calendar sync fields to schedule_events
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedule_events_google_event_id ON schedule_events(google_event_id);

-- 3. Add Google Calendar sync fields to tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);

-- 4. Create sync_log table for tracking sync operations
CREATE TABLE IF NOT EXISTS google_calendar_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('schedule_event', 'task')),
    event_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    google_event_id TEXT,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON google_calendar_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON google_calendar_sync_log(created_at);

-- Enable RLS
ALTER TABLE google_calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view their own sync logs"
    ON google_calendar_sync_log FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Function to check if user has Google Calendar connected
CREATE OR REPLACE FUNCTION is_google_calendar_connected(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_connected BOOLEAN;
    v_token_expires TIMESTAMPTZ;
BEGIN
    SELECT 
        google_calendar_connected,
        google_calendar_token_expires_at
    INTO v_connected, v_token_expires
    FROM user_settings
    WHERE user_id = p_user_id;

    -- Check if connected and token not expired
    IF v_connected AND v_token_expires > NOW() THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get events that need syncing
CREATE OR REPLACE FUNCTION get_events_to_sync(p_user_id UUID)
RETURNS TABLE (
    event_type TEXT,
    event_id UUID,
    title TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    description TEXT,
    google_event_id TEXT,
    synced_to_google BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Get schedule events
    SELECT 
        'schedule_event'::TEXT,
        se.id,
        se.title,
        se.start_time,
        se.end_time,
        se.description,
        se.google_event_id,
        se.synced_to_google
    FROM schedule_events se
    WHERE se.user_id = p_user_id
    AND (se.synced_to_google = false OR se.google_event_id IS NULL)
    AND se.start_time > NOW()
    
    UNION ALL
    
    -- Get tasks with deadlines
    SELECT 
        'task'::TEXT,
        t.id,
        t.title,
        t.deadline,
        t.deadline + INTERVAL '1 hour', -- Default 1 hour duration
        t.description,
        t.google_event_id,
        t.synced_to_google
    FROM tasks t
    WHERE t.user_id = p_user_id
    AND t.deadline IS NOT NULL
    AND (t.synced_to_google = false OR t.google_event_id IS NULL)
    AND t.deadline > NOW()
    AND t.status != 'completed';
END;
$$ LANGUAGE plpgsql;

-- 7. Function to mark event as synced
CREATE OR REPLACE FUNCTION mark_event_synced(
    p_event_type TEXT,
    p_event_id UUID,
    p_google_event_id TEXT
)
RETURNS VOID AS $$
BEGIN
    IF p_event_type = 'schedule_event' THEN
        UPDATE schedule_events
        SET 
            google_event_id = p_google_event_id,
            synced_to_google = true,
            last_synced_at = NOW()
        WHERE id = p_event_id;
    ELSIF p_event_type = 'task' THEN
        UPDATE tasks
        SET 
            google_event_id = p_google_event_id,
            synced_to_google = true,
            last_synced_at = NOW()
        WHERE id = p_event_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to log sync operation
CREATE OR REPLACE FUNCTION log_sync_operation(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_id UUID,
    p_operation TEXT,
    p_google_event_id TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_calendar_sync_log (
        user_id,
        event_type,
        event_id,
        operation,
        google_event_id,
        success,
        error_message
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_id,
        p_operation,
        p_google_event_id,
        p_success,
        p_error_message
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to mark events for sync when created/updated
CREATE OR REPLACE FUNCTION trigger_google_calendar_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark as needing sync
    NEW.synced_to_google = false;
    NEW.last_synced_at = NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for schedule_events
DROP TRIGGER IF EXISTS trigger_schedule_event_sync ON schedule_events;
CREATE TRIGGER trigger_schedule_event_sync
    BEFORE INSERT OR UPDATE OF title, start_time, end_time, description
    ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_google_calendar_sync();

-- Create triggers for tasks
DROP TRIGGER IF EXISTS trigger_task_sync ON tasks;
CREATE TRIGGER trigger_task_sync
    BEFORE INSERT OR UPDATE OF title, deadline, description
    ON tasks
    FOR EACH ROW
    WHEN (NEW.deadline IS NOT NULL)
    EXECUTE FUNCTION trigger_google_calendar_sync();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Google Calendar integration setup completed!';
    RAISE NOTICE 'Tables updated: user_settings, schedule_events, tasks';
    RAISE NOTICE 'New table created: google_calendar_sync_log';
    RAISE NOTICE 'Functions created: is_google_calendar_connected, get_events_to_sync, mark_event_synced, log_sync_operation';
    RAISE NOTICE 'Triggers created: Auto-mark events for sync on create/update';
END $$;
