# 🔔 Complete Notification System Setup & Testing Guide

## 📋 Quick Start (5 Steps)

### Step 1: Run Database Migrations

```sql
-- In Supabase SQL Editor, run these in order:

-- 1. Reminder system
-- File: supabase/migrations/REMINDER_SYSTEM_SETUP_FIXED.sql

-- 2. Achievement & Weekly Reports
-- File: supabase/migrations/ADD_ACHIEVEMENT_WEEKLY_NOTIFICATIONS.sql
```

### Step 2: Test in Browser

1. Open `test-notifications.html` in your browser
2. Click "Request Permission" and allow notifications
3. Test all 4 notification types
4. Verify all checkboxes turn green ✅

### Step 3: Test in Database

1. Open `TEST_NOTIFICATIONS_QUICK.sql`
2. Replace `'YOUR_USER_ID'` with your actual user ID
3. Run the script in Supabase SQL Editor
4. Verify all checks pass ✅

### Step 4: Test in Your App

1. Go to Settings → Notifications
2. Verify you see these toggles:
   - ✅ Study Plan Reminders
   - ✅ Task Deadline Reminders
   - ✅ Reminder Time (10/30/60 min)
   - ✅ Email Alerts
   - ✅ Achievement Notifications
   - ✅ Weekly Reports

3. Toggle each ON and OFF
4. Verify settings save to database

### Step 5: Test Real Reminders

1. Create a schedule event 30 minutes from now
2. Create a task with deadline 1 hour from now
3. Wait for reminder time
4. Verify browser notification appears
5. Complete a task
6. Verify achievement notification appears

---

## 🎯 What's Included

### Database Tables

1. **reminders** - Tracks all scheduled reminders
2. **notification_log** - Audit trail of sent notifications
3. **achievements** - User achievements
4. **weekly_reports** - Weekly progress summaries

### User Settings (New Columns)

```sql
enable_study_reminders          BOOLEAN DEFAULT true
enable_task_reminders           BOOLEAN DEFAULT true
reminder_time                   INTEGER DEFAULT 30
enable_email_alerts             BOOLEAN DEFAULT false
enable_achievement_notifications BOOLEAN DEFAULT true
enable_weekly_reports           BOOLEAN DEFAULT true
weekly_report_day               INTEGER DEFAULT 1
weekly_report_time              TIME DEFAULT '09:00:00'
google_calendar_connected       BOOLEAN DEFAULT false
```

### Automatic Features

✅ **Auto-Create Reminders**
- When you create a schedule event → Reminder created
- When you add task deadline → Reminder created
- When you update deadline → Old reminder deleted, new one created

✅ **Auto-Cancel Reminders**
- When you complete event/task → Reminder cancelled
- When you delete event/task → Reminder cancelled

✅ **Auto-Unlock Achievements**
- Complete 1st task → "First Task Complete!" 🎉
- Complete 10 tasks → "Task Master" 🎯
- Complete 50 tasks → "Productivity Pro" ⭐
- Complete 100 tasks → "Century Club" 💯

✅ **Visual Indicators**
- Events < 1 hour away → Yellow border + "Soon" badge
- Overdue events → Red border + "Overdue" badge
- Normal events → No special styling

---

## 🧪 Testing Checklist

### Database Tests

- [ ] Tables created successfully
- [ ] Triggers working (auto-create reminders)
- [ ] Functions executable
- [ ] RLS policies active
- [ ] Indexes created

### Browser Tests

- [ ] Permission requested and granted
- [ ] Test notification appears
- [ ] Reminder notification appears
- [ ] Achievement notification appears
- [ ] No duplicate notifications

### Settings Tests

- [ ] Study reminders toggle works
- [ ] Task reminders toggle works
- [ ] Reminder time selector works
- [ ] Email alerts toggle works
- [ ] Achievement notifications toggle works
- [ ] Weekly reports toggle works
- [ ] Settings persist after page refresh

### Integration Tests

- [ ] Create event → Reminder created
- [ ] Update deadline → Reminder updated
- [ ] Complete event → Reminder cancelled
- [ ] Delete event → Reminder cancelled
- [ ] Complete task → Achievement unlocked
- [ ] Settings OFF → No reminders created

### Visual Tests

- [ ] Upcoming events show yellow border
- [ ] Overdue events show red border
- [ ] "Soon" badge appears correctly
- [ ] "Overdue" badge appears correctly
- [ ] Alert badges have correct colors

---

## 📊 Verification Queries

### Check System Health

```sql
-- Pending reminders
SELECT COUNT(*) as pending_reminders
FROM reminders
WHERE status = 'pending';

-- Recent achievements
SELECT COUNT(*) as recent_achievements
FROM achievements
WHERE unlocked_at > NOW() - INTERVAL '24 hours';

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

### Check Your Settings

```sql
SELECT 
    enable_study_reminders,
    enable_task_reminders,
    reminder_time,
    enable_email_alerts,
    enable_achievement_notifications,
    enable_weekly_reports
FROM user_settings 
WHERE user_id = auth.uid();
```

### Check Your Reminders

```sql
SELECT 
    event_type,
    event_title,
    event_time,
    reminder_time,
    status,
    (reminder_time - NOW()) as time_until_reminder
FROM reminders 
WHERE user_id = auth.uid()
AND status = 'pending'
ORDER BY reminder_time ASC;
```

### Check Your Achievements

```sql
SELECT 
    achievement_type,
    title,
    description,
    icon,
    unlocked_at,
    notified
FROM achievements
WHERE user_id = auth.uid()
ORDER BY unlocked_at DESC;
```

---

## 🎨 UI Components Needed

### 1. Settings Page - Notifications Section

```typescript
// Add to your Settings page
import { ReminderSettings } from '@/components/settings/ReminderSettings';

<ReminderSettings />
```

### 2. Alert Badges on Events/Tasks

```typescript
// Add to your event/task cards
import { AlertBadge } from '@/components/ui/alert-badge';

<AlertBadge level={alertLevel} />
```

### 3. Achievement Toast

```typescript
// Show when achievement unlocked
import { toast } from 'sonner';

toast.success('🏆 Achievement Unlocked!', {
  description: 'First Task Complete!'
});
```

---

## 🚀 Deployment Checklist

### Supabase Setup

- [ ] Run REMINDER_SYSTEM_SETUP_FIXED.sql
- [ ] Run ADD_ACHIEVEMENT_WEEKLY_NOTIFICATIONS.sql
- [ ] Verify all tables created
- [ ] Verify all triggers created
- [ ] Test with sample data

### Frontend Setup

- [ ] Add ReminderSettings component
- [ ] Add AlertBadge component
- [ ] Initialize notification service
- [ ] Start reminder polling service
- [ ] Add achievement toast notifications

### Edge Functions (Optional - for email)

- [ ] Deploy check-reminders function
- [ ] Deploy send-reminder-email function
- [ ] Set up cron job (every minute)
- [ ] Configure email service (Resend/SendGrid)
- [ ] Test email delivery

### Google Calendar (Optional)

- [ ] Set up Google OAuth
- [ ] Deploy google-calendar-auth function
- [ ] Deploy sync-to-google-calendar function
- [ ] Add calendar sync UI
- [ ] Test sync flow

---

## 🎯 Success Criteria

### ✅ System is Working If:

1. **Reminders**
   - Auto-created when events/tasks added
   - Appear at correct time (30 min before by default)
   - Cancelled when events completed/deleted
   - Respect user settings (ON/OFF)

2. **Notifications**
   - Browser notifications appear
   - No duplicates sent
   - Visual indicators show correctly
   - Achievement toasts appear

3. **Settings**
   - All toggles work
   - Changes persist
   - Settings apply immediately
   - No errors in console

4. **Performance**
   - Queries execute in < 100ms
   - No memory leaks
   - Handles 100+ events smoothly
   - Polling doesn't slow down app

---

## 🐛 Troubleshooting

### Reminders Not Created

**Check:**
```sql
-- User settings exist?
SELECT * FROM user_settings WHERE user_id = auth.uid();

-- Reminders enabled?
SELECT enable_study_reminders, enable_task_reminders 
FROM user_settings WHERE user_id = auth.uid();

-- Triggers working?
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%reminder%';
```

**Fix:**
```sql
-- Create user settings if missing
INSERT INTO user_settings (user_id) 
VALUES (auth.uid())
ON CONFLICT DO NOTHING;

-- Enable reminders
UPDATE user_settings 
SET enable_study_reminders = true, enable_task_reminders = true
WHERE user_id = auth.uid();
```

### Notifications Not Appearing

**Check:**
```javascript
// Browser permission
console.log('Permission:', Notification.permission);

// Service running
console.log('Polling:', reminderPollingService.getStatus());
```

**Fix:**
```javascript
// Request permission
await notificationService.requestPermission();

// Start service
reminderPollingService.start(userId);
```

### Visual Indicators Not Showing

**Check:**
```sql
-- View exists?
SELECT * FROM upcoming_events_with_alerts LIMIT 1;

-- Events have correct times?
SELECT title, event_time, alert_level 
FROM upcoming_events_with_alerts 
WHERE user_id = auth.uid();
```

**Fix:**
- Verify event times are in future
- Check CSS classes are applied
- Verify AlertBadge component imported

---

## 📚 Files Reference

### Database Migrations
- `supabase/migrations/REMINDER_SYSTEM_SETUP_FIXED.sql`
- `supabase/migrations/ADD_ACHIEVEMENT_WEEKLY_NOTIFICATIONS.sql`

### Testing Files
- `REMINDER_SYSTEM_TESTING_GUIDE.md` - Comprehensive testing guide
- `TEST_NOTIFICATIONS_QUICK.sql` - Quick SQL test script
- `test-notifications.html` - Browser notification tester

### Documentation
- `REMINDER_SYSTEM_IMPLEMENTATION.md` - Full implementation guide
- `NOTIFICATION_SYSTEM_COMPLETE_GUIDE.md` - This file

---

## 🎉 You're Done!

Your notification system is now complete with:
- ✅ Study plan reminders
- ✅ Task deadline reminders
- ✅ Achievement notifications
- ✅ Weekly progress reports
- ✅ Visual indicators
- ✅ User-controlled settings
- ✅ No Pomodoro interruptions

**Next Steps:**
1. Run the migrations
2. Test with `test-notifications.html`
3. Add UI components to your app
4. Deploy and enjoy! 🚀
