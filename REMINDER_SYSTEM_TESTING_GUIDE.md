# Reminder System Testing Guide

## 🧪 Complete Testing Checklist

### Phase 1: Database Setup Verification

#### 1.1 Run the Migration
```sql
-- In Supabase SQL Editor, run:
-- supabase/migrations/REMINDER_SYSTEM_SETUP_FIXED.sql
```

#### 1.2 Verify Tables Created
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reminders', 'notification_log');

-- Should return 2 rows
```

#### 1.3 Verify user_settings Columns
```sql
-- Check new columns in user_settings
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name IN (
    'enable_study_reminders',
    'enable_task_reminders',
    'reminder_time',
    'enable_email_alerts',
    'enable_achievement_notifications',
    'enable_weekly_reports',
    'google_calendar_connected'
);

-- Should return 7 rows
```

#### 1.4 Verify Triggers Created
```sql
-- Check triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%reminder%';

-- Should show:
-- - trigger_create_schedule_event_reminder
-- - trigger_create_task_reminder
-- - trigger_cancel_schedule_event_reminders
-- - trigger_cancel_task_reminders
```

---

### Phase 2: Manual Testing

#### 2.1 Test Reminder Creation for Schedule Events

```sql
-- Insert a test schedule event (30 minutes from now)
INSERT INTO schedule_events (
    user_id,
    title,
    description,
    start_time,
    end_time,
    type
) VALUES (
    'YOUR_USER_ID', -- Replace with your actual user ID
    'Test Study Session',
    'Testing reminder system',
    NOW() + INTERVAL '30 minutes',
    NOW() + INTERVAL '1 hour',
    'study'
);

-- Check if reminder was created
SELECT * FROM reminders 
WHERE event_type = 'schedule_event' 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show a new reminder with:
-- - status = 'pending'
-- - reminder_time = start_time - 30 minutes (or your custom setting)
```

#### 2.2 Test Reminder Creation for Tasks

```sql
-- Insert a test task with deadline (1 hour from now)
INSERT INTO tasks (
    user_id,
    title,
    description,
    deadline,
    status
) VALUES (
    'YOUR_USER_ID', -- Replace with your actual user ID
    'Test Task with Deadline',
    'Testing task reminder',
    NOW() + INTERVAL '1 hour',
    'pending'
);

-- Check if reminder was created
SELECT * FROM reminders 
WHERE event_type = 'task' 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show a new reminder
```

#### 2.3 Test Upcoming Events View

```sql
-- Get your upcoming events with alerts
SELECT * FROM upcoming_events_with_alerts
WHERE user_id = 'YOUR_USER_ID'
ORDER BY event_time ASC;

-- Should show:
-- - Your test events
-- - alert_level: 'normal', 'upcoming', or 'overdue'
-- - reminder_status: 'pending', 'sent', etc.
```

#### 2.4 Test Reminder Cancellation

```sql
-- Mark a task as completed
UPDATE tasks
SET status = 'completed'
WHERE title = 'Test Task with Deadline';

-- Check if reminder was cancelled
SELECT status FROM reminders
WHERE event_type = 'task'
AND event_title = 'Test Task with Deadline';

-- Should show status = 'cancelled'
```

#### 2.5 Test Get Pending Reminders Function

```sql
-- Get all pending reminders
SELECT * FROM get_pending_reminders();

-- Should return reminders that are:
-- - status = 'pending'
-- - reminder_time <= NOW()
-- - reminder_time > NOW() - 5 minutes
```

---

### Phase 3: Settings UI Testing

#### 3.1 Test Settings Page

1. **Navigate to Settings**
   - Go to your app's Settings page
   - Look for "Notifications" or "Reminders" section

2. **Test Study Reminders Toggle**
   ```
   ✓ Toggle ON → Should enable study reminders
   ✓ Toggle OFF → Should disable study reminders
   ✓ Check database:
   ```
   ```sql
   SELECT enable_study_reminders FROM user_settings WHERE user_id = 'YOUR_USER_ID';
   ```

3. **Test Task Reminders Toggle**
   ```
   ✓ Toggle ON → Should enable task reminders
   ✓ Toggle OFF → Should disable task reminders
   ```

4. **Test Reminder Time Selector**
   ```
   ✓ Select "10 minutes before"
   ✓ Select "30 minutes before"
   ✓ Select "1 hour before"
   ✓ Check database:
   ```
   ```sql
   SELECT reminder_time FROM user_settings WHERE user_id = 'YOUR_USER_ID';
   ```

5. **Test Email Alerts Toggle**
   ```
   ✓ Toggle ON → Should enable email alerts
   ✓ Toggle OFF → Should disable email alerts
   ```

6. **Test Achievement Notifications Toggle**
   ```
   ✓ Toggle ON → Should enable achievement notifications
   ✓ Toggle OFF → Should disable achievement notifications
   ```

7. **Test Weekly Reports Toggle**
   ```
   ✓ Toggle ON → Should enable weekly progress summary
   ✓ Toggle OFF → Should disable weekly reports
   ```

---

### Phase 4: Browser Notification Testing

#### 4.1 Request Notification Permission

1. **Open Browser Console** (F12)
2. **Run:**
   ```javascript
   Notification.requestPermission().then(permission => {
     console.log('Notification permission:', permission);
   });
   ```
3. **Expected:** Browser shows permission prompt
4. **Click "Allow"**

#### 4.2 Test Manual Notification

```javascript
// In browser console
new Notification('Test Notification', {
  body: 'This is a test notification from StudyAI',
  icon: '/logo.png'
});
```

**Expected:** Notification appears on your screen

#### 4.3 Test Reminder Notification Service

1. **Create a task/event with deadline in 2 minutes**
2. **Wait for reminder time**
3. **Expected:** Browser notification appears

---

### Phase 5: Visual Indicators Testing

#### 5.1 Test Alert Badges

1. **Create events with different timings:**
   - Event in 30 minutes → Should show "Soon" badge (yellow)
   - Event in past → Should show "Overdue" badge (red)
   - Event in 2 hours → Should show no badge

2. **Check in UI:**
   ```
   ✓ Yellow border for upcoming events (< 1 hour)
   ✓ Red border for overdue events
   ✓ Normal border for future events
   ```

#### 5.2 Test Task List Visual Indicators

1. **Navigate to Tasks page**
2. **Check for:**
   ```
   ✓ Tasks with deadlines < 1 hour have yellow indicator
   ✓ Overdue tasks have red indicator
   ✓ Future tasks have normal appearance
   ```

---

### Phase 6: Integration Testing

#### 6.1 Test Complete Flow

**Scenario 1: Create → Remind → Complete**
```
1. Create a schedule event (30 min from now)
2. Wait for reminder (should appear at reminder_time)
3. Mark event as completed
4. Verify reminder is cancelled
```

**Scenario 2: Create → Update → Remind**
```
1. Create a task with deadline (1 hour from now)
2. Update deadline to 15 minutes from now
3. Verify old reminder is deleted
4. Verify new reminder is created
5. Wait for notification
```

**Scenario 3: Create → Delete**
```
1. Create a schedule event
2. Delete the event
3. Verify reminder is cancelled
```

#### 6.2 Test Settings Persistence

```
1. Toggle reminders OFF
2. Create a new task with deadline
3. Verify NO reminder is created
4. Toggle reminders ON
5. Create another task
6. Verify reminder IS created
```

---

### Phase 7: Performance Testing

#### 7.1 Test with Multiple Events

```sql
-- Create 10 test events
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO schedule_events (
            user_id,
            title,
            start_time,
            end_time,
            type
        ) VALUES (
            'YOUR_USER_ID',
            'Test Event ' || i,
            NOW() + (i || ' hours')::INTERVAL,
            NOW() + (i || ' hours')::INTERVAL + INTERVAL '1 hour',
            'study'
        );
    END LOOP;
END $$;

-- Verify 10 reminders created
SELECT COUNT(*) FROM reminders WHERE user_id = 'YOUR_USER_ID';
```

#### 7.2 Test Query Performance

```sql
-- Should be fast (< 100ms)
EXPLAIN ANALYZE
SELECT * FROM upcoming_events_with_alerts
WHERE user_id = 'YOUR_USER_ID';

-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM reminders
WHERE user_id = 'YOUR_USER_ID'
AND status = 'pending'
AND reminder_time <= NOW();
```

---

### Phase 8: Edge Cases Testing

#### 8.1 Test Past Events

```sql
-- Create event in the past
INSERT INTO schedule_events (
    user_id,
    title,
    start_time,
    end_time
) VALUES (
    'YOUR_USER_ID',
    'Past Event',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes'
);

-- Verify NO reminder is created (event is in past)
SELECT * FROM reminders WHERE event_title = 'Past Event';
-- Should return 0 rows
```

#### 8.2 Test Null Deadline

```sql
-- Create task without deadline
INSERT INTO tasks (
    user_id,
    title,
    status
) VALUES (
    'YOUR_USER_ID',
    'Task Without Deadline',
    'pending'
);

-- Verify NO reminder is created
SELECT * FROM reminders WHERE event_title = 'Task Without Deadline';
-- Should return 0 rows
```

#### 8.3 Test Reminder Time Edge Cases

```sql
-- Test with custom reminder times
UPDATE user_settings 
SET reminder_time = 10 
WHERE user_id = 'YOUR_USER_ID';

-- Create event
INSERT INTO schedule_events (
    user_id,
    title,
    start_time,
    end_time
) VALUES (
    'YOUR_USER_ID',
    'Event with 10min reminder',
    NOW() + INTERVAL '15 minutes',
    NOW() + INTERVAL '45 minutes'
);

-- Verify reminder_time is 10 minutes before
SELECT 
    event_title,
    event_time,
    reminder_time,
    event_time - reminder_time as time_before
FROM reminders 
WHERE event_title = 'Event with 10min reminder';
-- time_before should be '00:10:00'
```

---

### Phase 9: Cleanup Test Data

```sql
-- Delete all test data
DELETE FROM reminders WHERE user_id = 'YOUR_USER_ID';
DELETE FROM schedule_events WHERE user_id = 'YOUR_USER_ID' AND title LIKE 'Test%';
DELETE FROM tasks WHERE user_id = 'YOUR_USER_ID' AND title LIKE 'Test%';
DELETE FROM notification_log WHERE user_id = 'YOUR_USER_ID';

-- Verify cleanup
SELECT 
    (SELECT COUNT(*) FROM reminders WHERE user_id = 'YOUR_USER_ID') as reminders_count,
    (SELECT COUNT(*) FROM schedule_events WHERE user_id = 'YOUR_USER_ID' AND title LIKE 'Test%') as events_count,
    (SELECT COUNT(*) FROM tasks WHERE user_id = 'YOUR_USER_ID' AND title LIKE 'Test%') as tasks_count;
-- All should be 0
```

---

## 🎯 Success Criteria

### ✅ All Tests Pass If:

1. **Database**
   - [x] All tables created successfully
   - [x] All triggers working
   - [x] All functions executable
   - [x] RLS policies active

2. **Reminders**
   - [x] Auto-created for new events/tasks
   - [x] Cancelled when events completed/deleted
   - [x] Updated when deadline changes
   - [x] Respect user settings (ON/OFF)

3. **Notifications**
   - [x] Browser permission requested
   - [x] Notifications appear at correct time
   - [x] No duplicate notifications
   - [x] Visual indicators show correctly

4. **Settings**
   - [x] All toggles work
   - [x] Settings persist in database
   - [x] Changes take effect immediately
   - [x] Achievement notifications toggle works
   - [x] Weekly reports toggle works

5. **Performance**
   - [x] Queries execute in < 100ms
   - [x] No memory leaks
   - [x] Handles 100+ events smoothly

---

## 🐛 Common Issues & Solutions

### Issue 1: Reminders Not Created
**Solution:**
```sql
-- Check if user_settings exists for user
SELECT * FROM user_settings WHERE user_id = 'YOUR_USER_ID';

-- If not, create it
INSERT INTO user_settings (user_id) VALUES ('YOUR_USER_ID');
```

### Issue 2: Notifications Not Appearing
**Solution:**
1. Check browser permission: `Notification.permission`
2. Check if service is running
3. Check browser console for errors

### Issue 3: Visual Indicators Not Showing
**Solution:**
1. Check if `upcoming_events_with_alerts` view exists
2. Verify event times are correct
3. Check CSS classes are applied

### Issue 4: Settings Not Saving
**Solution:**
```sql
-- Check RLS policies
SELECT * FROM user_settings WHERE user_id = auth.uid();

-- Verify user is authenticated
SELECT auth.uid();
```

---

## 📊 Monitoring Queries

### Check System Health
```sql
-- Pending reminders count
SELECT COUNT(*) as pending_reminders
FROM reminders
WHERE status = 'pending';

-- Failed reminders (last 24 hours)
SELECT COUNT(*) as failed_reminders
FROM reminders
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '24 hours';

-- Notification success rate
SELECT 
    notification_type,
    COUNT(*) as total,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
    ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type;
```

### User Activity
```sql
-- Users with reminders enabled
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN enable_study_reminders THEN 1 ELSE 0 END) as study_reminders_enabled,
    SUM(CASE WHEN enable_task_reminders THEN 1 ELSE 0 END) as task_reminders_enabled,
    SUM(CASE WHEN enable_email_alerts THEN 1 ELSE 0 END) as email_alerts_enabled
FROM user_settings;
```

---

## 🎉 Testing Complete!

Once all tests pass, your reminder system is fully functional and ready for production use!

**Next Steps:**
1. Deploy Edge Functions for email alerts
2. Set up cron job for reminder checking
3. Monitor system performance
4. Gather user feedback
