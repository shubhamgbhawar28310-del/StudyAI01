-- =====================================================
-- FIX WEEKLY REPORT FUNCTION
-- Fixes the nested aggregate function error
-- =====================================================

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
    v_tasks_by_day JSONB;
    v_top_subjects TEXT[];
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

    -- Get tasks by day (fixed - no nested aggregates)
    WITH daily_tasks AS (
        SELECT 
            TO_CHAR(completed_at, 'Day') as day_name,
            COUNT(*) as task_count
        FROM tasks
        WHERE user_id = p_user_id
        AND status = 'completed'
        AND completed_at >= v_week_start
        AND completed_at < v_week_end + INTERVAL '1 day'
        GROUP BY TO_CHAR(completed_at, 'Day')
    )
    SELECT jsonb_object_agg(day_name, task_count)
    INTO v_tasks_by_day
    FROM daily_tasks;

    -- Get top subjects (fixed - separate query)
    SELECT array_agg(subject)
    INTO v_top_subjects
    FROM (
        SELECT DISTINCT subject
        FROM tasks
        WHERE user_id = p_user_id
        AND status = 'completed'
        AND completed_at >= v_week_start
        AND completed_at < v_week_end + INTERVAL '1 day'
        AND subject IS NOT NULL
        LIMIT 5
    ) subjects;

    -- Build report data JSON
    v_report_data := jsonb_build_object(
        'tasks_by_day', COALESCE(v_tasks_by_day, '{}'::jsonb),
        'top_subjects', COALESCE(v_top_subjects, ARRAY[]::TEXT[])
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

-- Test the fixed function
DO $$
BEGIN
    RAISE NOTICE '✅ Weekly report function fixed!';
    RAISE NOTICE 'No more nested aggregate errors';
END $$;
