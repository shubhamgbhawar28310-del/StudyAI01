-- =====================================================
-- ADD ACHIEVEMENT & WEEKLY REPORT NOTIFICATIONS
-- =====================================================

-- Add columns for achievement and weekly report notifications
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS enable_achievement_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_weekly_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_report_day INTEGER DEFAULT 1 CHECK (weekly_report_day BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
ADD COLUMN IF NOT EXISTS weekly_report_time TIME DEFAULT '09:00:00';

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL CHECK (achievement_type IN (
        'first_task',
        'first_study_session',
        'streak_7',
        'streak_30',
        'tasks_10',
        'tasks_50',
        'tasks_100',
        'study_hours_10',
        'study_hours_50',
        'study_hours_100',
        'perfect_week',
        'early_bird',
        'night_owl',
        'focus_master'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_achievements_notified ON achievements(notified);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
CREATE POLICY "Users can view their own achievements"
    ON achievements FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert achievements" ON achievements;
CREATE POLICY "System can insert achievements"
    ON achievements FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own achievements" ON achievements;
CREATE POLICY "Users can update their own achievements"
    ON achievements FOR UPDATE
    USING (auth.uid() = user_id);

-- Create weekly_reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    study_hours DECIMAL(10,2) DEFAULT 0,
    pomodoro_sessions INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    top_subjects TEXT[],
    achievements_unlocked INTEGER DEFAULT 0,
    report_data JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON weekly_reports(week_start);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_reports_user_week ON weekly_reports(user_id, week_start);

-- Enable RLS
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own weekly reports" ON weekly_reports;
CREATE POLICY "Users can view their own weekly reports"
    ON weekly_reports FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert weekly reports" ON weekly_reports;
CREATE POLICY "System can insert weekly reports"
    ON weekly_reports FOR INSERT
    WITH CHECK (true);

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_and_unlock_achievement(
    p_user_id UUID,
    p_achievement_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_icon TEXT DEFAULT '🏆'
)
RETURNS UUID AS $$
DECLARE
    v_achievement_id UUID;
    v_already_unlocked BOOLEAN;
BEGIN
    -- Check if achievement already unlocked
    SELECT EXISTS(
        SELECT 1 FROM achievements
        WHERE user_id = p_user_id
        AND achievement_type = p_achievement_type
    ) INTO v_already_unlocked;

    -- If not unlocked, create it
    IF NOT v_already_unlocked THEN
        INSERT INTO achievements (
            user_id,
            achievement_type,
            title,
            description,
            icon,
            notified
        ) VALUES (
            p_user_id,
            p_achievement_type,
            p_title,
            p_description,
            p_icon,
            false
        )
        RETURNING id INTO v_achievement_id;

        RETURN v_achievement_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get unnotified achievements
CREATE OR REPLACE FUNCTION get_unnotified_achievements()
RETURNS TABLE (
    achievement_id UUID,
    user_id UUID,
    user_email TEXT,
    achievement_type TEXT,
    title TEXT,
    description TEXT,
    icon TEXT,
    unlocked_at TIMESTAMPTZ,
    enable_notifications BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        u.email,
        a.achievement_type,
        a.title,
        a.description,
        a.icon,
        a.unlocked_at,
        us.enable_achievement_notifications
    FROM achievements a
    JOIN auth.users u ON a.user_id = u.id
    JOIN user_settings us ON a.user_id = us.user_id
    WHERE a.notified = false
    AND us.enable_achievement_notifications = true
    AND a.unlocked_at > NOW() - INTERVAL '5 minutes'
    ORDER BY a.unlocked_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark achievement as notified
CREATE OR REPLACE FUNCTION mark_achievement_notified(p_achievement_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE achievements
    SET notified = true
    WHERE id = p_achievement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate weekly report
CREATE OR REPLACE FUNCTION generate_weekly_report(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_report_id UUID;
    v_week_start DATE;
    v_week_end DATE;
    v_tasks_completed INTEGER;
    v_study_hours DECIMAL(10,2);
    v_pomodoro_sessions INTEGER;
    v_achievements_unlocked INTEGER;
    v_report_data JSONB;
BEGIN
    -- Calculate week boundaries (Monday to Sunday)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')::DATE;
    v_week_end := v_week_start + INTERVAL '6 days';

    -- Check if report already exists
    IF EXISTS(
        SELECT 1 FROM weekly_reports
        WHERE user_id = p_user_id
        AND week_start = v_week_start
    ) THEN
        RETURN NULL;
    END IF;

    -- Calculate tasks completed
    SELECT COUNT(*)
    INTO v_tasks_completed
    FROM tasks
    WHERE user_id = p_user_id
    AND status = 'completed'
    AND completed_at >= v_week_start
    AND completed_at < v_week_end + INTERVAL '1 day';

    -- Calculate study hours (from pomodoro sessions)
    SELECT COALESCE(SUM(duration), 0) / 60.0
    INTO v_study_hours
    FROM pomodoro_sessions
    WHERE user_id = p_user_id
    AND completed = true
    AND type = 'work'
    AND start_time >= v_week_start
    AND start_time < v_week_end + INTERVAL '1 day';

    -- Count pomodoro sessions
    SELECT COUNT(*)
    INTO v_pomodoro_sessions
    FROM pomodoro_sessions
    WHERE user_id = p_user_id
    AND completed = true
    AND type = 'work'
    AND start_time >= v_week_start
    AND start_time < v_week_end + INTERVAL '1 day';

    -- Count achievements unlocked
    SELECT COUNT(*)
    INTO v_achievements_unlocked
    FROM achievements
    WHERE user_id = p_user_id
    AND unlocked_at >= v_week_start
    AND unlocked_at < v_week_end + INTERVAL '1 day';

    -- Build report data JSON
    v_report_data := jsonb_build_object(
        'tasks_by_day', (
            SELECT jsonb_object_agg(
                TO_CHAR(completed_at, 'Day'),
                COUNT(*)
            )
            FROM tasks
            WHERE user_id = p_user_id
            AND status = 'completed'
            AND completed_at >= v_week_start
            AND completed_at < v_week_end + INTERVAL '1 day'
            GROUP BY TO_CHAR(completed_at, 'Day')
        ),
        'top_subjects', (
            SELECT array_agg(DISTINCT subject)
            FROM tasks
            WHERE user_id = p_user_id
            AND status = 'completed'
            AND completed_at >= v_week_start
            AND completed_at < v_week_end + INTERVAL '1 day'
            AND subject IS NOT NULL
            LIMIT 5
        )
    );

    -- Insert weekly report
    INSERT INTO weekly_reports (
        user_id,
        week_start,
        week_end,
        tasks_completed,
        study_hours,
        pomodoro_sessions,
        achievements_unlocked,
        report_data
    ) VALUES (
        p_user_id,
        v_week_start,
        v_week_end,
        v_tasks_completed,
        v_study_hours,
        v_pomodoro_sessions,
        v_achievements_unlocked,
        v_report_data
    )
    RETURNING id INTO v_report_id;

    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get users who need weekly reports
CREATE OR REPLACE FUNCTION get_users_for_weekly_report()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    weekly_report_day INTEGER,
    weekly_report_time TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.user_id,
        u.email,
        us.weekly_report_day,
        us.weekly_report_time
    FROM user_settings us
    JOIN auth.users u ON us.user_id = u.id
    WHERE us.enable_weekly_reports = true
    AND us.weekly_report_day = EXTRACT(DOW FROM CURRENT_DATE)
    AND NOT EXISTS (
        SELECT 1 FROM weekly_reports wr
        WHERE wr.user_id = us.user_id
        AND wr.week_start = DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')::DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for achievements when task is completed
CREATE OR REPLACE FUNCTION check_task_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_completed_count INTEGER;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Count total completed tasks
        SELECT COUNT(*)
        INTO v_completed_count
        FROM tasks
        WHERE user_id = NEW.user_id
        AND status = 'completed';

        -- Check for first task achievement
        IF v_completed_count = 1 THEN
            PERFORM check_and_unlock_achievement(
                NEW.user_id,
                'first_task',
                'First Task Complete!',
                'You completed your first task. Great start!',
                '✅'
            );
        END IF;

        -- Check for 10 tasks achievement
        IF v_completed_count = 10 THEN
            PERFORM check_and_unlock_achievement(
                NEW.user_id,
                'tasks_10',
                'Task Master',
                'You completed 10 tasks!',
                '🎯'
            );
        END IF;

        -- Check for 50 tasks achievement
        IF v_completed_count = 50 THEN
            PERFORM check_and_unlock_achievement(
                NEW.user_id,
                'tasks_50',
                'Productivity Pro',
                'You completed 50 tasks!',
                '⭐'
            );
        END IF;

        -- Check for 100 tasks achievement
        IF v_completed_count = 100 THEN
            PERFORM check_and_unlock_achievement(
                NEW.user_id,
                'tasks_100',
                'Century Club',
                'You completed 100 tasks!',
                '💯'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_task_achievements ON tasks;
CREATE TRIGGER trigger_check_task_achievements
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_task_achievements();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Achievement & Weekly Report system setup completed!';
    RAISE NOTICE 'Tables created: achievements, weekly_reports';
    RAISE NOTICE 'Functions created: check_and_unlock_achievement, generate_weekly_report, etc.';
    RAISE NOTICE 'Triggers created: Auto-unlock achievements';
    RAISE NOTICE '';
    RAISE NOTICE 'New user_settings columns:';
    RAISE NOTICE '  - enable_achievement_notifications';
    RAISE NOTICE '  - enable_weekly_reports';
    RAISE NOTICE '  - weekly_report_day';
    RAISE NOTICE '  - weekly_report_time';
END $$;
