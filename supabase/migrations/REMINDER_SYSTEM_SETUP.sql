-- =====================================================
-- REMINDER & ALERT SYSTEM SETUP
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

-- 2. Create reminders table to track sent notifications
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('study_plan', 'task')),
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

-- 3. Create notification_log table for tracking all notifications
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

-- 4. Create function to automatically create reminders for new study plans
CREATE OR REPLACE FUNCTION create_study_plan_reminder()
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

    -- Only create reminder if enabled
    IF user_reminders_enabled THEN
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
            'study_plan',
            NEW.id,
            NEW.title,
            NEW.start_time,
            NEW.start_time - (COALESCE(user_reminder_time, 30) || ' minutes')::INTERVAL,
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to automatically create reminders for tasks with deadlines
CREATE OR REPLACE FUNCTION create_task_reminder()
RETURNS TRIGGER AS $$
DECLARE
    user_reminder_time INTEGER;
    user_reminders_enabled BOOLEAN;
BEGIN
    -- Only create reminder if task has a deadline
    IF NEW.deadline IS NOT NULL THEN
        -- Get user's reminder preferences
        SELECT reminder_time, enable_task_reminders
        INTO user_reminder_time, user_reminders_enabled
        FROM user_settings
        WHERE user_id = NEW.user_id;

        -- Only create reminder if enabled
        IF user_reminders_enabled THEN
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
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers for automatic reminder creation
DROP TRIGGER IF EXISTS trigger_create_study_plan_reminder ON study_plans;
CREATE TRIGGER trigger_create_study_plan_reminder
    AFTER INSERT ON study_plans
    FOR EACH ROW
    EXECUTE FUNCTION create_study_plan_reminder();

DROP TRIGGER IF EXISTS trigger_create_task_reminder ON tasks;
CREATE TRIGGER trigger_create_task_reminder
    AFTER INSERT OR UPDATE OF deadline ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION create_task_reminder();

-- 7. Function to get pending reminders (called by cron job)
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

-- 8. Function to mark reminder as sent
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

-- 9. Function to cancel reminders when event is completed/deleted
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

-- 10. Create triggers to cancel reminders
DROP TRIGGER IF EXISTS trigger_cancel_study_plan_reminders ON study_plans;
CREATE TRIGGER trigger_cancel_study_plan_reminders
    BEFORE DELETE ON study_plans
    FOR EACH ROW
    EXECUTE FUNCTION cancel_event_reminders('study_plan');

DROP TRIGGER IF EXISTS trigger_cancel_task_reminders ON tasks;
CREATE TRIGGER trigger_cancel_task_reminders
    BEFORE DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION cancel_event_reminders('task');

-- 11. Function to sync task and study plan completion status
CREATE OR REPLACE FUNCTION sync_completion_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a study plan is marked as completed, mark associated task as completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE tasks
        SET 
            status = 'completed',
            completed_at = NOW()
        WHERE study_plan_id = NEW.id
        AND status != 'completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_study_plan_completion ON study_plans;
CREATE TRIGGER trigger_sync_study_plan_completion
    AFTER UPDATE OF status ON study_plans
    FOR EACH ROW
    EXECUTE FUNCTION sync_completion_status();

-- 12. Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies for reminders
CREATE POLICY "Users can view their own reminders"
    ON reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders"
    ON reminders FOR INSERT
    WITH CHECK (true);

-- 14. Create RLS policies for notification_log
CREATE POLICY "Users can view their own notification logs"
    ON notification_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs"
    ON notification_log FOR INSERT
    WITH CHECK (true);

-- 15. Create view for upcoming events with visual indicators
CREATE OR REPLACE VIEW upcoming_events_with_alerts AS
SELECT 
    'study_plan' as event_type,
    sp.id,
    sp.user_id,
    sp.title,
    sp.start_time as event_time,
    sp.end_time,
    sp.status,
    CASE 
        WHEN sp.start_time <= NOW() AND sp.status != 'completed' THEN 'overdue'
        WHEN sp.start_time <= NOW() + INTERVAL '1 hour' THEN 'upcoming'
        ELSE 'normal'
    END as alert_level,
    r.id as reminder_id,
    r.status as reminder_status
FROM study_plans sp
LEFT JOIN reminders r ON r.event_id = sp.id AND r.event_type = 'study_plan'
WHERE sp.status != 'completed'

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

-- 16. Create function to clean up old reminders (run monthly)
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

-- 17. Create function to get user's upcoming events
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
    RAISE NOTICE 'Reminder system setup completed successfully!';
    RAISE NOTICE 'Tables created: reminders, notification_log';
    RAISE NOTICE 'Functions created: create_study_plan_reminder, create_task_reminder, get_pending_reminders, etc.';
    RAISE NOTICE 'Triggers created: Auto-create reminders for new events';
    RAISE NOTICE 'View created: upcoming_events_with_alerts';
END $$;
