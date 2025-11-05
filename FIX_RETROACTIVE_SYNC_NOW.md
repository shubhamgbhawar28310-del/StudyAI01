# Fix Retroactive Google Calendar Sync - Step by Step

## Issue
Events created BEFORE connecting Google Calendar are not syncing.

## Root Causes (Possible)
1. Missing database columns (`synced_to_google`, `google_event_id`)
2. Edge function not deployed
3. Database triggers not working
4. RLS policies blocking access

## Fix Steps - Do These IN ORDER

### Step 1: Check Database Columns
Run this SQL in Supabase SQL Editor:

```sql
-- Run DEBUG_SYNC_ISSUE.sql to check current state
```

If columns are missing, run:
```sql
-- Run ADD_SYNC_COLUMNS.sql to add them
```

### Step 2: Deploy Edge Functions

```bash
# Deploy all three functions
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync
supabase functions deploy google-calendar-worker
supabase functions deploy google-calendar-batch-sync

# Verify they're deployed
supabase functions list
```

### Step 3: Set Environment Variables

```bash
supabase secrets list

# If any are missing, set them:
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
```

### Step 4: Test the Sync

1. Open browser console (F12)
2. Go to Settings → Notifications
3. Click "Sync to Calendar"
4. Watch the console logs

**Expected logs:**
```
🔄 Step 1: Queuing all unsynced events...
✅ Batch sync response: { stats: { queued: X } }
🔄 Step 2: Processing sync queue...
✅ Worker response: { results: { processed: Y } }
```

**If you see errors:**
- Copy the error message
- Check Supabase Edge Function logs
- Run the debug SQL queries

### Step 5: Manual Queue and Process

If the button doesn't work, manually trigger via SQL:

```sql
-- 1. Manually add events to queue
INSERT INTO google_calendar_sync_queue (
  user_id,
  event_type,
  event_id,
  operation,
  event_data
)
SELECT 
  user_id,
  'schedule_event',
  id,
  'create',
  jsonb_build_object(
    'summary', '📚 ' || title,
    'description', COALESCE(description, 'Study session'),
    'start', jsonb_build_object('dateTime', start_time, 'timeZone', 'UTC'),
    'end', jsonb_build_object('dateTime', end_time, 'timeZone', 'UTC'),
    'reminders', jsonb_build_object(
      'useDefault', false,
      'overrides', jsonb_build_array(
        jsonb_build_object('method', 'popup', 'minutes', 10)
      )
    )
  )
FROM schedule_events
WHERE (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL
  AND user_id = 'YOUR_USER_ID_HERE'
ON CONFLICT (event_type, event_id) DO NOTHING;

-- 2. Check queue
SELECT * FROM google_calendar_sync_queue 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC;

-- 3. Manually trigger worker via Supabase dashboard
-- Go to Edge Functions → google-calendar-worker → Invoke
```

### Step 6: Verify in Google Calendar

1. Open Google Calendar
2. Look for events with 📚 emoji
3. They should match your study planner events

## Quick Test Commands

```bash
# Test batch-sync function
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/google-calendar-batch-sync' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "YOUR_USER_ID"}'

# Test worker function
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/google-calendar-worker' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Common Errors and Fixes

### Error: "Function not found"
**Fix:** Deploy the edge function
```bash
supabase functions deploy google-calendar-batch-sync
```

### Error: "User settings not found"
**Fix:** Check if user has Google Calendar connected
```sql
SELECT * FROM user_settings WHERE user_id = 'YOUR_USER_ID';
```

### Error: "Column does not exist"
**Fix:** Run ADD_SYNC_COLUMNS.sql

### Error: "Permission denied"
**Fix:** Check RLS policies
```sql
-- Allow users to read sync queue
CREATE POLICY IF NOT EXISTS "Users can view their own sync queue"
ON google_calendar_sync_queue FOR SELECT
USING (auth.uid() = user_id);
```

### Events queued but not processing
**Fix:** Manually invoke worker
```bash
supabase functions invoke google-calendar-worker
```

## Success Checklist

- [ ] Database columns exist (synced_to_google, google_event_id)
- [ ] Edge functions deployed (batch-sync, worker, auth, sync)
- [ ] Environment variables set (CLIENT_ID, CLIENT_SECRET)
- [ ] Google Calendar connected in settings
- [ ] Sync button shows "Queued X events"
- [ ] Events appear in Google Calendar
- [ ] Console shows no errors

## Still Not Working?

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard
   - Edge Functions → Logs
   - Look for errors

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for red errors

3. **Run Debug SQL:**
   ```sql
   -- See DEBUG_SYNC_ISSUE.sql
   ```

4. **Check Google Calendar API:**
   - Go to Google Cloud Console
   - APIs & Services → Credentials
   - Verify OAuth client is configured
   - Check redirect URIs match

## Need More Help?

Share these details:
1. Error message from console
2. Output of DEBUG_SYNC_ISSUE.sql
3. Edge function logs from Supabase
4. Whether edge functions are deployed (`supabase functions list`)
