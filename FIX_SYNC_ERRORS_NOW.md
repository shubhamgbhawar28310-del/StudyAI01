# 🔧 Fix Sync Errors - Token & Event Format

## 🔍 Issues Found

From your failed syncs:
1. ❌ **"Failed to refresh token"** - Google Calendar token expired
2. ❌ **"Missing end time"** - Event data format incorrect

## ✅ Fix 1: Reconnect Google Calendar (Token Issue)

The refresh token has expired or is invalid. You need to reconnect:

### Steps:

1. **Go to your app** (Study Planner)
2. **Find Google Calendar settings** (usually in Settings or Profile)
3. **Click "Disconnect Google Calendar"**
4. **Click "Connect Google Calendar"** again
5. **Grant permissions** when Google asks
6. **Done!** New tokens will be stored

This will give you fresh access and refresh tokens.

## ✅ Fix 2: Update Event Data Format (Missing End Time)

The trigger is creating event data with wrong format. Let's fix it:

### Run this SQL in Supabase:

```sql
-- Drop old trigger function
DROP FUNCTION IF EXISTS add_schedule_event_to_sync_queue() CASCADE;

-- Create corrected function with proper event format
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
          'dateTime', to_char(NEW.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'timeZone', 'UTC'
        ),
        'end', jsonb_build_object(
          'dateTime', to_char(NEW.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
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

-- Recreate triggers
DROP TRIGGER IF EXISTS schedule_event_insert_sync_trigger ON schedule_events;
CREATE TRIGGER schedule_event_insert_sync_trigger
AFTER INSERT ON schedule_events
FOR EACH ROW
EXECUTE FUNCTION add_schedule_event_to_sync_queue();

DROP TRIGGER IF EXISTS schedule_event_update_sync_trigger ON schedule_events;
CREATE TRIGGER schedule_event_update_sync_trigger
AFTER UPDATE ON schedule_events
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title 
   OR OLD.start_time IS DISTINCT FROM NEW.start_time 
   OR OLD.end_time IS DISTINCT FROM NEW.end_time)
EXECUTE FUNCTION add_schedule_event_to_sync_queue();
```

## ✅ Fix 3: Reset Failed Events

After fixing the issues above, reset the failed events to retry:

```sql
-- Reset failed events to pending so they can be retried
UPDATE google_calendar_sync_queue 
SET 
  status = 'pending',
  retry_count = 0,
  error_message = NULL
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours';
```

## ✅ Fix 4: Test with New Event

1. **Reconnect Google Calendar** (Fix 1)
2. **Run the SQL fixes** (Fix 2 & 3)
3. **Create a test event** in Study Planner:
   - Title: "Sync Test"
   - Start: Tomorrow 2:00 PM
   - End: Tomorrow 3:00 PM
4. **Trigger sync**:
   ```powershell
   .\sync-calendar.bat
   ```
5. **Check Google Calendar** - event should appear!

## 🔍 Verify the Fix

### Check event data format:

```sql
SELECT 
  id,
  event_data->'start'->>'dateTime' as start_time,
  event_data->'end'->>'dateTime' as end_time,
  event_data->>'summary' as title,
  status
FROM google_calendar_sync_queue
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Both start_time and end_time should have values like:
```
2025-11-04T14:00:00Z
2025-11-04T15:00:00Z
```

### Check token status:

```sql
SELECT 
  user_id,
  google_calendar_connected,
  google_calendar_email,
  google_calendar_token_expires_at,
  CASE 
    WHEN google_calendar_token_expires_at > NOW() THEN '✅ Valid'
    ELSE '❌ Expired'
  END as token_status
FROM user_settings
WHERE google_calendar_connected = true;
```

**Expected**: token_status should be '✅ Valid'

## 📋 Complete Fix Checklist

- [ ] Disconnected Google Calendar in app
- [ ] Reconnected Google Calendar (fresh tokens)
- [ ] Ran SQL to fix trigger function
- [ ] Reset failed events to pending
- [ ] Created test event
- [ ] Triggered manual sync
- [ ] Verified event appears in Google Calendar
- [ ] Checked that new events have proper format

## 🎯 Expected Results

After these fixes:
- ✅ Token is valid and can be refreshed
- ✅ Events have proper start/end time format
- ✅ Sync completes successfully
- ✅ Events appear in Google Calendar

## 🆘 If Still Having Issues

### Issue: Token still failing

**Solution**: Check if refresh token is being stored:
```sql
SELECT 
  user_id,
  google_calendar_refresh_token IS NOT NULL as has_refresh_token,
  google_calendar_token IS NOT NULL as has_access_token
FROM user_settings
WHERE google_calendar_connected = true;
```

Both should be true. If not, reconnect Google Calendar.

### Issue: Events still have wrong format

**Solution**: Check the trigger is using the new function:
```sql
SELECT 
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%schedule_event%sync%';
```

Should reference `add_schedule_event_to_sync_queue()`.

### Issue: Sync still failing

**Solution**: Check worker logs:
1. Supabase Dashboard → Edge Functions → google-calendar-worker → Logs
2. Look for specific error messages
3. Share the error for more help

## 🚀 After Fix

Your complete flow will be:
1. ✅ Create event in Study Planner
2. ✅ Trigger adds event to queue (with correct format)
3. ✅ Worker syncs to Google Calendar (with valid token)
4. ✅ Event appears in Google Calendar
5. ✅ Automatic sync every 5 minutes

All fixed! 🎉