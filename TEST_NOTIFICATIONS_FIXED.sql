-- =====================================================
-- QUICK TEST SCRIPT FOR NOTIFICATIONS (FIXED)
-- =====================================================

-- Step 0: Fix schedule_events status column first
-- Run FIX_SCHEDULE_EVENTS_STATUS.sql if you haven't already

-- Step 1: Get your user ID
SELECT id, email FROM auth.users WHERE email = 'kishanindrachand@gmail.com';
-- Result: 8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62

-- Step 2: Check your current settings
SELECT 
    enable_study_reminders,
    enable_task_reminders,
    reminder_time,
    enable_email_alerts,
    enable_achievement_notifications,
    enable_weekly_reports
FROM user_settings 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';

-- Step 3: Enable all notifications (if not already)
UPDATE user_settings
SET 
    enable_study_reminders = true,
    enable_task_reminders = true,
    reminder_time = 30,
    enable_achievement_notifications = true,
    enable_weekly_reports = true
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';

-- Step 4: Create a test schedule event (30 minutes from now)
-- Note: Removed 'status' - it will use default 'pending'
INSERT INTO schedule_events (
    user_id,
    title,
    description,
    start_time,
    end_time,
    type
) VALUES (
    '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62',
    'Test Study Session - Reminder Test',
    'This is a test to verify reminders work',
    NOW() + INTERVAL '30 minutes',
    NOW() + INTERVAL '1 hour',
    'study'
)
RETURNING id, title, start_time;

-- Step 5: Verify reminder was created
SELECT 
    id,
    event_type,
    event_title,
    event_time,
    reminder_time,
    status,
    EXTRACT(EPOCH FROM (reminder_time - NOW()))/60 as minutes_until_reminder
FROM reminders 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
AND event_type = 'schedule_event'
ORDER BY created_at DESC 
LIMIT 1;

-- Step 6: Create a test task with deadline (1 hour from now)
INSERT INTO tasks (
    user_id,
    title,
    description,
    deadline,
    priority
) VALUES (
    '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62',
    'Test Task - Deadline Reminder',
    'Testing task deadline reminders',
    NOW() + INTERVAL '1 hour',
    'high'
)
RETURNING id, title, deadline;

-- Step 7: Verify task reminder was created
SELECT 
    id,
    event_type,
    event_title,
    event_time,
    reminder_time,
    status,
    EXTRACT(EPOCH FROM (reminder_time - NOW()))/60 as minutes_until_reminder
FROM reminders 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
AND event_type = 'task'
ORDER BY created_at DESC 
LIMIT 1;

-- Step 8: Check upcoming events with alerts
SELECT 
    event_type,
    title,
    event_time,
    alert_level,
    reminder_status,
    EXTRACT(EPOCH FROM (event_time - NOW()))/60 as minutes_until_event
FROM upcoming_events_with_alerts
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
ORDER BY event_time ASC;

-- Step 9: Test achievement unlock
-- Complete a task to trigger achievement
UPDATE tasks
SET status = 'completed', completed_at = NOW()
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
AND title = 'Test Task - Deadline Reminder';

-- Check if achievement was unlocked
SELECT 
    achievement_type,
    title,
    description,
    icon,
    unlocked_at,
    notified
FROM achievements
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
ORDER BY unlocked_at DESC
LIMIT 5;

-- Step 10: Test weekly report generation
SELECT generate_weekly_report('8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62');

-- Check the generated report
SELECT 
    week_start,
    week_end,
    tasks_completed,
    study_hours,
    pomodoro_sessions,
    achievements_unlocked,
    report_data,
    created_at
FROM weekly_reports
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- VERIFICATION CHECKLIST
-- =====================================================

-- ✓ Check 1: User settings updated
SELECT 
    'Settings Check' as test,
    CASE 
        WHEN enable_study_reminders AND enable_task_reminders 
            AND enable_achievement_notifications AND enable_weekly_reports
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM user_settings 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';

-- ✓ Check 2: Reminders created
SELECT 
    'Reminders Check' as test,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS - ' || COUNT(*) || ' reminders created'
        ELSE '❌ FAIL - Only ' || COUNT(*) || ' reminders'
    END as result
FROM reminders 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62'
AND status = 'pending';

-- ✓ Check 3: Achievements unlocked
SELECT 
    'Achievements Check' as test,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ PASS - ' || COUNT(*) || ' achievements unlocked'
        ELSE '❌ FAIL - No achievements'
    END as result
FROM achievements 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';

-- ✓ Check 4: Weekly report generated
SELECT 
    'Weekly Report Check' as test,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ PASS - Report generated'
        ELSE '❌ FAIL - No report'
    END as result
FROM weekly_reports 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';

-- ✓ Check 5: Visual indicators working
SELECT 
    'Visual Indicators Check' as test,
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ PASS - ' || COUNT(*) || ' events with alerts'
        ELSE '❌ FAIL - No events'
    END as result
FROM upcoming_events_with_alerts 
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT 
    '🎉 Testing Complete!' as message,
    (SELECT COUNT(*) FROM reminders WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62') as total_reminders,
    (SELECT COUNT(*) FROM achievements WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62') as total_achievements,
    (SELECT COUNT(*) FROM weekly_reports WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62') as total_reports;

-- =====================================================
-- CLEANUP (Run this after testing)
-- =====================================================

-- Uncomment to clean up test data:
/*
DELETE FROM reminders WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62' AND event_title LIKE 'Test%';
DELETE FROM schedule_events WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62' AND title LIKE 'Test%';
DELETE FROM tasks WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62' AND title LIKE 'Test%';
DELETE FROM achievements WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';
DELETE FROM weekly_reports WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';
DELETE FROM notification_log WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';
*/
