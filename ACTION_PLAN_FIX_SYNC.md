# ACTION PLAN: Fix Google Calendar Retroactive Sync

## Do These Steps IN ORDER

### Step 1: Add Database Columns (If Missing)
Open Supabase SQL Editor and run:
```sql
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id TEXT;
```

### Step 2: Deploy Edge Function
```bash
supabase functions deploy google-calendar-batch-sync
```

### Step 3: Test the Sync
1. Open your app
2. Go to Settings → Notifications
3. Open browser console (F12)
4. Click "Sync to Calendar" button
5. Watch the console logs

**Expected Output:**
```
🔄 Step 1: Queuing all unsynced events...
✅ Batch sync response: { stats: { queued: 5 } }
🔄 Step 2: Processing sync queue...
✅ Worker response: { results: { processed: 5, failed: 0 } }
```

### Step 4: Verify in Google Calendar
Open Google Calendar and check for events with 📚 emoji

## If Step 3 Fails

### Error: "Function not found"
The edge function isn't deployed. Run:
```bash
supabase functions deploy google-calendar-batch-sync
```

### Error: "Column does not exist"
Run Step 1 again (add columns SQL)

### Error: "Google Calendar not connected"
1. Go to Settings
2. Click "Connect Google Calendar"
3. Complete OAuth
4. Try sync again

### No Error But No Events Syncing
Manually queue events using SQL:
```sql
-- Run MANUAL_QUEUE_ALL_EVENTS.sql in Supabase SQL Editor
```

Then manually invoke worker:
- Supabase Dashboard → Edge Functions → google-calendar-worker → Invoke

## Quick Manual Fix (If Button Doesn't Work)

1. **Queue events manually:**
```sql
INSERT INTO google_calendar_sync_queue (user_id, event_type, event_id, operation, event_data)
SELECT 
  user_id, 'schedule_event', id, 'create',
  jsonb_build_object(
    'summary', '📚 ' || title,
    'description', COALESCE(description, 'Study session'),
    'start', jsonb_build_object('dateTime', start_time, 'timeZone', 'UTC'),
    'end', jsonb_build_object('dateTime', end_time, 'timeZone', 'UTC'),
    'reminders', jsonb_build_object('useDefault', false, 'overrides', jsonb_build_array(
      jsonb_build_object('method', 'popup', 'minutes', 10)
    ))
  )
FROM schedule_events
WHERE (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL
ON CONFLICT (event_type, event_id) DO NOTHING;
```

2. **Invoke worker:**
   - Supabase Dashboard → Edge Functions → google-calendar-worker → Click "Invoke"

3. **Check Google Calendar**

## Verification Checklist

- [ ] Database columns exist (run DEBUG_SYNC_ISSUE.sql)
- [ ] Edge function deployed (`supabase functions list`)
- [ ] Google Calendar connected (check Settings)
- [ ] Sync button works (check console logs)
- [ ] Events appear in Google Calendar

## Still Having Issues?

Share these details:
1. **Console error message** (from browser F12)
2. **Edge function logs** (from Supabase Dashboard)
3. **Output of this SQL:**
```sql
SELECT COUNT(*) as unsynced_events
FROM schedule_events
WHERE (synced_to_google IS NULL OR synced_to_google = false)
  AND google_event_id IS NULL;
```
