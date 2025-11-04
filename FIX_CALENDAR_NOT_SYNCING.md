# 🔧 Fix: Calendar Sync Running But Events Not Appearing

## 🔍 The Problem

The cron job is running successfully every 5 minutes, but events aren't appearing in Google Calendar.

## ✅ Diagnosis Steps

### Step 1: Check What's in the Sync Queue

Run this in Supabase SQL Editor (`CHECK_SYNC_STATUS.sql`):

```sql
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected**: Should see your events with status 'pending', 'completed', or 'failed'
**If empty**: Events aren't being added to the queue (trigger issue)

### Step 2: Check Worker Function Logs

1. Go to: https://supabase.com/dashboard/project/crdqpioymuvnzhtgrenj/functions
2. Click `google-calendar-worker`
3. Click **"Logs"** tab
4. Look for errors or "processed: 0" messages

**Common issues**:
- "No pending items" = Queue is empty
- "User settings not found" = User not connected properly
- "Failed to refresh token" = Token expired
- "Failed to create event" = Google API error

### Step 3: Check if Events Are Being Created

```sql
SELECT COUNT(*) FROM schedule_events 
WHERE synced_to_google = false 
  OR synced_to_google IS NULL;
```

**If > 0**: Events exist but aren't synced
**If 0**: All events are marked as synced (but might not actually be in Google Calendar)

## 🎯 Most Likely Issues & Fixes

### Issue 1: Events Not Added to Queue (No Trigger)

**Symptom**: Sync queue is empty

**Fix**: Create the trigger that adds events to the queue

```sql
-- Create function to add events to sync queue
CREATE OR REPLACE FUNCTION add_schedule_event_to_sync_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add to queue if user has Google Calendar connected
  IF EXISTS (
    SELECT 1 FROM user_settings 
    WHERE user_id = NEW.user_id 
    AND google_calendar_connected = true
  ) THEN
    INSERT INTO google_calendar_sync_queue (
      user_id,
      event_type,
      event_id,
      operation,
      event_data,
      status
    ) VALUES (
      NEW.user_id,
      'schedule_event',
      NEW.id,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'create'
        WHEN TG_OP = 'UPDATE' THEN 'update'
        ELSE 'create'
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
      ),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS schedule_event_insert_sync_trigger ON schedule_events;
CREATE TRIGGER schedule_event_insert_sync_trigger
AFTER INSERT ON schedule_events
FOR EACH ROW
EXECUTE FUNCTION add_schedule_event_to_sync_queue();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS schedule_event_update_sync_trigger ON schedule_events;
CREATE TRIGGER schedule_event_update_sync_trigger
AFTER UPDATE ON schedule_events
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title 
   OR OLD.start_time IS DISTINCT FROM NEW.start_time 
   OR OLD.end_time IS DISTINCT FROM NEW.end_time)
EXECUTE FUNCTION add_schedule_event_to_sync_queue();
```

### Issue 2: Token Expired

**Symptom**: Worker logs show "Failed to refresh token"

**Fix**: Reconnect Google Calendar

1. Go to your app
2. Disconnect Google Calendar
3. Reconnect Google Calendar
4. Try syncing again

### Issue 3: Worker Not Processing Queue

**Symptom**: Events stuck in 'pending' status

**Fix**: Manually trigger worker

```powershell
Invoke-RestMethod -Uri "https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker" -Method POST -Headers @{"Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"}
```

### Issue 4: Google API Quota Exceeded

**Symptom**: Worker logs show "quota exceeded" or "rate limit"

**Fix**: Wait 1 hour and try again. Google Calendar API has limits.

### Issue 5: Wrong Calendar Being Used

**Symptom**: Events syncing but not visible

**Fix**: Check if events are going to a different calendar

1. Open Google Calendar
2. Check "Other calendars" section
3. Make sure "primary" calendar is visible

## 🔄 Add Sync Button to Your App

I created `GoogleCalendarSyncButton.tsx` component. Add it to your Study Planner:

```tsx
// In your ScheduleView or Dashboard
import { GoogleCalendarSyncButton } from '@/components/features/GoogleCalendarSyncButton';

// Add the button somewhere visible:
<GoogleCalendarSyncButton />
```

This gives users a manual sync button!

## 🧪 Test the Complete Flow

### Step 1: Create a Test Event

1. Go to Study Planner
2. Create a new event: "Test Sync Event"
3. Set time: Tomorrow at 2:00 PM

### Step 2: Check Queue

```sql
SELECT * FROM google_calendar_sync_queue 
WHERE event_data->>'summary' LIKE '%Test Sync%';
```

Should see the event in 'pending' status.

### Step 3: Trigger Sync

Click the "Sync to Calendar" button or run:
```powershell
.\sync-calendar.bat
```

### Step 4: Verify

```sql
SELECT * FROM google_calendar_sync_queue 
WHERE event_data->>'summary' LIKE '%Test Sync%';
```

Status should be 'completed'.

### Step 5: Check Google Calendar

Open Google Calendar - event should appear!

## 📊 Debug Checklist

Run through this checklist:

- [ ] Ran `CHECK_SYNC_STATUS.sql` to see queue status
- [ ] Checked worker function logs for errors
- [ ] Verified trigger exists (creates queue entries)
- [ ] Confirmed user has google_calendar_connected = true
- [ ] Checked token hasn't expired
- [ ] Manually triggered worker function
- [ ] Verified events appear in sync queue
- [ ] Checked Google Calendar (correct calendar visible)
- [ ] Looked for API quota errors

## 🎯 Quick Fixes

**If queue is empty**:
```sql
-- Run the trigger creation SQL above
```

**If events stuck in pending**:
```powershell
# Manually trigger sync
.\sync-calendar.bat
```

**If token expired**:
- Reconnect Google Calendar in app

**If all else fails**:
```sql
-- Reset and retry failed events
UPDATE google_calendar_sync_queue 
SET status = 'pending', retry_count = 0, error_message = NULL
WHERE status = 'failed';
```

## 🚀 After Fix

Your sync flow should be:
1. ✅ Create event in Study Planner
2. ✅ Event added to sync queue (trigger)
3. ✅ Cron job runs every 5 minutes
4. ✅ Worker processes queue
5. ✅ Event appears in Google Calendar

Or use the manual "Sync to Calendar" button for immediate sync! 🎉