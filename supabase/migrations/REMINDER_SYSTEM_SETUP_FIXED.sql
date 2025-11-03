-- =====================================================
-- REMINDER & ALERT SYSTEM SETUP (Fixed for existing schema)
-- Works with: tasks, schedule_events tables
-- =====================================================

-- 1. Update user_settings table with reminder preferences
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS enable_study_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_task_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_time INTEGER DEFAULT 30, -- minutes before event
ADD COLUMN IF NOT EXISTS enable_email_alerts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;

-- 2. Add status and deadline columns to tasks if they don't exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update deadline from due_date if it exists
UPDATE tasks SET deadline = due_date WHERE deadline IS NULL AND due_date IS NOT NULL;

-- 3. Add status column to schedule_events if it doesn't exist
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled'));

-- 4. Create reminders table to track sent notifications
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('schedule_event', 'task')),
    event_id UUID NOT NULL,
    event_title TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    reminder_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    notification_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_event_type_id ON reminders(event_type, event_id);

-- 5. Create notification_log table for tracking all notifications
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_id UUID REFERENCES reminders(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('browser', 'email')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at);

-- 6. Create function to automatically create reminders for new schedule events
CREATE OR REPLACE FUNCTION create_schedule_event_reminder()
RETURNS TRIGGER AS $$
DECLARE
    user_reminder_time INTEGER;
    user_reminders_enabled BOOLEAN;
BEGIN
    -- Get user's reminder preferences
    SELECT reminder_time, enable_study_reminders
    INTO user_reminder_time, user_reminders_enabled
    FROM user_settings
    WHERE user_id = NEW.user_id;

    -- Only create reminder if enabled and event is in the future
    IF user_reminders_enabled AND NEW.start_time > NOW() THEN
        INSERT INTO reminders (
            user_id,
            event_type,
            event_id,
            event_title,
            event_time,
            reminder_time,
            status
        ) VALUES (
            NEW.user_id,
            'schedule_event',
            NEW.id,
            NEW.title,
            NEW.start_time,
            NEW.start_time - (COALESCE(user_reminder_time, 30) || ' minutes')::INTERVAL,
            'pending'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to automatically create reminders for tasks with deadlines
CREATE OR REPLACE FUNCTION create_task_reminder()
RETURNS TRIGGER AS $$
DECLARE
    user_reminder_time INTEGER;
    user_reminders_enabled BOOLEAN;
BEGIN
    -- Only create reminder if task has a deadline and is in the future
    IF NEW.deadline IS NOT NULL AND NEW.deadline > NOW() THEN
        -- Get user's reminder preferences
        SELECT reminder_time, enable_task_reminders
        INTO user_reminder_time, user_reminders_enabled
        FROM user_settings
        WHERE user_id = NEW.user_id;

        -- Only create reminder if enabled
        IF user_reminders_enabled THEN
            -- Delete old reminder if updating deadline
            DELETE FROM reminders 
            WHERE event_type = 'task' 
            AND event_id = NEW.id 
            AND status = 'pending';

            -- Create new reminder
            INSERT INTO reminders (
                user_id,
                event_type,
                event_id,
                event_title,
                event_time,
                reminder_time,
                status
            ) VALUES (
                NEW.user_id,
                'task',
                NEW.id,
                NEW.title,
                NEW.deadline,
                NEW.deadline - (COALESCE(user_reminder_time, 30) || ' minutes')::INTERVAL,
                'pending'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for automatic reminder creation
DROP TRIGGER IF EXISTS trigger_create_schedule_event_reminder ON schedule_events;
CREATE TRIGGER trigger_create_schedule_event_reminder
    AFTER INSERT ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION create_schedule_event_reminder();

DROP TRIGGER IF EXISTS trigger_create_task_reminder ON tasks;
CREATE TRIGGER trigger_create_task_reminder
    AFTER INSERT OR UPDATE OF deadline ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_task_reminder();

-- 9. Function to get pending reminders (called by cron job)
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
    reminder_id UUID,
    user_id UUID,
    event_type TEXT,
    event_id UUID,
    event_title TEXT,
    event_time TIMESTAMPTZ,
    reminder_time TIMESTAMPTZ,
    user_email TEXT,
    enable_email_alerts BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.user_id,
        r.event_type,
        r.event_id,
        r.event_title,
        r.event_time,
        r.reminder_time,
        u.email,
        us.enable_email_alerts
    FROM reminders r
    JOIN auth.users u ON r.user_id = u.id
    JOIN user_settings us ON r.user_id = us.user_id
    WHERE r.status = 'pending'
    AND r.reminder_time <= NOW()
    AND r.reminder_time > NOW() - INTERVAL '5 minutes' -- Don't send old reminders
    ORDER BY r.reminder_time ASC;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
    p_reminder_id UUID,
    p_notification_sent BOOLEAN DEFAULT false,
    p_email_sent BOOLEAN DEFAULT false,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE reminders
    SET 
        status = CASE 
            WHEN p_error_message IS NOT NULL THEN 'failed'
            ELSE 'sent'
        END,
        notification_sent = p_notification_sent,
        email_sent = p_email_sent,
        sent_at = NOW(),
        error_message = p_error_message
    WHERE id = p_reminder_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Function to cancel reminders when event is completed/deleted
CREATE OR REPLACE FUNCTION cancel_event_reminders()
RETURNS TRIGGER AS $$
BEGIN
    -- Cancel reminders for completed or deleted events
    UPDATE reminders
    SET status = 'cancelled'
    WHERE event_type = TG_ARGV[0]
    AND event_id = OLD.id
    AND status = 'pending';

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers to cancel reminders
DROP TRIGGER IF EXISTS trigger_cancel_schedule_event_reminders ON schedule_events;
CREATE TRIGGER trigger_cancel_schedule_event_reminders
    BEFORE DELETE ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION cancel_event_reminders('schedule_event');

DROP TRIGGER IF EXISTS trigger_cancel_task_reminders ON tasks;
CREATE TRIGGER trigger_cancel_task_reminders
    BEFORE DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION cancel_event_reminders('task');

-- 13. Function to sync task completion when marked as completed
CREATE OR REPLACE FUNCTION sync_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- When a task is marked as completed, set completed_at timestamp
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at = NOW();
        
        -- Cancel any pending reminders
        UPDATE reminders
        SET status = 'cancelled'
        WHERE event_type = 'task'
        AND event_id = NEW.id
        AND status = 'pending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_task_completion ON tasks;
CREATE TRIGGER trigger_sync_task_completion
    BEFORE UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION sync_task_completion();

-- 14. Function to sync schedule event completion
CREATE OR REPLACE FUNCTION sync_schedule_event_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- When a schedule event is marked as completed, cancel reminders
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE reminders
        SET status = 'cancelled'
        WHERE event_type = 'schedule_event'
        AND event_id = NEW.id
        AND status = 'pending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_schedule_event_completion ON schedule_events;
CREATE TRIGGER trigger_sync_schedule_event_completion
    BEFORE UPDATE OF status ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION sync_schedule_event_completion();

-- 15. Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- 16. Create RLS policies for reminders
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
CREATE POLICY "Users can view their own reminders"
    ON reminders FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
CREATE POLICY "Users can update their own reminders"
    ON reminders FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert reminders" ON reminders;
CREATE POLICY "System can insert reminders"
    ON reminders FOR INSERT
    WITH CHECK (true);

-- 17. Create RLS policies for notification_log
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_log;
CREATE POLICY "Users can view their own notification logs"
    ON notification_log FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notification logs" ON notification_log;
CREATE POLICY "System can insert notification logs"
    ON notification_log FOR INSERT
    WITH CHECK (true);

-- 18. Create view for upcoming events with visual indicators
CREATE OR REPLACE VIEW upcoming_events_with_alerts AS
SELECT 
    'schedule_event' as event_type,
    se.id,
    se.user_id,
    se.title,
    se.start_time as event_time,
    se.end_time,
    se.status,
    CASE 
        WHEN se.start_time <= NOW() AND se.status != 'completed' THEN 'overdue'
        WHEN se.start_time <= NOW() + INTERVAL '1 hour' THEN 'upcoming'
        ELSE 'normal'
    END as alert_level,
    r.id as reminder_id,
    r.status as reminder_status
FROM schedule_events se
LEFT JOIN reminders r ON r.event_id = se.id AND r.event_type = 'schedule_event'
WHERE se.status != 'completed'

UNION ALL

SELECT 
    'task' as event_type,
    t.id,
    t.user_id,
    t.title,
    t.deadline as event_time,
    NULL as end_time,
    t.status,
    CASE 
        WHEN t.deadline <= NOW() AND t.status != 'completed' THEN 'overdue'
        WHEN t.deadline <= NOW() + INTERVAL '1 hour' THEN 'upcoming'
        ELSE 'normal'
    END as alert_level,
    r.id as reminder_id,
    r.status as reminder_status
FROM tasks t
LEFT JOIN reminders r ON r.event_id = t.id AND r.event_type = 'task'
WHERE t.deadline IS NOT NULL
AND t.status != 'completed';

-- Grant access to the view
GRANT SELECT ON upcoming_events_with_alerts TO authenticated;

-- 19. Create function to clean up old reminders (run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_reminders()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM reminders
    WHERE status IN ('sent', 'cancelled', 'failed')
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 20. Create function to get user's upcoming events
CREATE OR REPLACE FUNCTION get_user_upcoming_events(p_user_id UUID)
RETURNS TABLE (
    event_type TEXT,
    event_id UUID,
    title TEXT,
    event_time TIMESTAMPTZ,
    alert_level TEXT,
    reminder_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uea.event_type,
        uea.id,
        uea.title,
        uea.event_time,
        uea.alert_level,
        COALESCE(uea.reminder_status, 'none')
    FROM upcoming_events_with_alerts uea
    WHERE uea.user_id = p_user_id
    AND uea.event_time >= NOW()
    ORDER BY uea.event_time ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Reminder system setup completed successfully!';
    RAISE NOTICE 'Tables created: reminders, notification_log';
    RAISE NOTICE 'Functions created: create_schedule_event_reminder, create_task_reminder, get_pending_reminders, etc.';
    RAISE NOTICE 'Triggers created: Auto-create reminders for new events';
    RAISE NOTICE 'View created: upcoming_events_with_alerts';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy Supabase Edge Functions for email alerts';
    RAISE NOTICE '2. Set up cron job to check reminders every minute';
    RAISE NOTICE '3. Add reminder settings UI to your app';
END $$;
