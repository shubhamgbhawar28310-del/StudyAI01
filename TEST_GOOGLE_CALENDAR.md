# ✅ Test Google Calendar Integration

## 🎉 Setup Complete! Now Let's Test

You've successfully:
- ✅ Enabled pg_cron extension
- ✅ Created the cron job
- ✅ Set up database migrations

Now let's test the integration!

---

## 🧪 Testing Checklist

### Test 1: Verify Cron Job is Running

Run this in Supabase SQL Editor:

```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'google-calendar-sync';

-- Check recent cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'google-calendar-sync')
ORDER BY start_time DESC 
LIMIT 5;
```

**Expected**: You should see the cron job listed and some run history.

---

### Test 2: Check Database Tables

```sql
-- Verify user_settings has Google Calendar columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name LIKE 'google%';

-- Verify schedule_events has sync columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'schedule_events' 
AND column_name LIKE '%google%' OR column_name LIKE '%sync%';

-- Verify sync queue table exists
SELECT * FROM google_calendar_sync_queue LIMIT 1;
```

**Expected**: All columns should exist, tables should be accessible.

---

### Test 3: Start Your App

```bash
npm run dev
```

Open: http://localhost:5173

---

### Test 4: Test OAuth Connection

1. **Go to Settings → Notifications**
2. **Scroll to "Calendar Sync" section**
3. **Click "Connect Calendar" button**
4. **Sign in with Google** (popup should open)
5. **Grant permissions** (Calendar + Email)
6. **Check the result**:
   - ✅ Should see: "✅ Connected as your@gmail.com"
   - ✅ Button should change to "Disconnect"

---

### Test 5: Verify Connection in Database

After connecting, run this in SQL Editor:

```sql
-- Check if your connection was saved
SELECT 
  user_id,
  google_calendar_connected,
  google_calendar_email,
  google_calendar_token IS NOT NULL as has_token,
  google_calendar_refresh_token IS NOT NULL as has_refresh_token,
  google_calendar_token_expires_at
FROM user_settings
WHERE google_calendar_connected = true;
```

**Expected**: You should see your user with `google_calendar_connected = true` and your email.

---

### Test 6: Create a Study Session

1. **Go to Study Planner**
2. **Create a new study session**:
   - Title: "Test React Hooks"
   - Start time: Today, 2:00 PM
   - End time: Today, 4:00 PM
3. **Save it**

---

### Test 7: Check Sync Queue

Run this in SQL Editor:

```sql
-- Check if event was added to sync queue
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: You should see your study session in the queue with `status = 'pending'`.

---

### Test 8: Wait for Sync (5 minutes)

The cron job runs every 5 minutes. Wait up to 5 minutes, then:

1. **Check your Google Calendar** (https://calendar.google.com)
2. **Look for**: 📚 Test React Hooks
3. **Verify**: 
   - Event exists
   - Time is correct
   - Has 10-minute reminder

---

### Test 9: Check Sync Status

After 5 minutes, run this:

```sql
-- Check if sync completed
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'completed'
ORDER BY processed_at DESC 
LIMIT 5;

-- Check the study session
SELECT 
  id,
  title,
  google_event_id,
  synced_to_google,
  last_synced_at
FROM schedule_events
WHERE title LIKE '%Test%'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: 
- Queue item should have `status = 'completed'`
- Study session should have `synced_to_google = true` and a `google_event_id`

---

### Test 10: Update the Event

1. **Go back to Study Planner**
2. **Edit the study session**:
   - Change title to: "Test React Hooks - Updated"
   - Change time to: 3:00 PM - 5:00 PM
3. **Save it**
4. **Wait 5 minutes**
5. **Check Google Calendar** - should see the update

---

### Test 11: Delete the Event

1. **Delete the study session** from Study Planner
2. **Wait 5 minutes**
3. **Check Google Calendar** - event should be removed

---

### Test 12: Test Task Deadline

1. **Go to Task Manager**
2. **Create a new task**:
   - Title: "Submit Assignment"
   - Deadline: Tomorrow, 11:59 PM
3. **Save it**
4. **Wait 5 minutes**
5. **Check Google Calendar** - should see: ✅ Submit Assignment

---

### Test 13: Disconnect Calendar

1. **Go to Settings → Notifications**
2. **Click "Disconnect Calendar"**
3. **Confirm**
4. **Verify**: 
   - Shows "Not connected"
   - Button changes back to "Connect Calendar"

---

## 🐛 Troubleshooting

### OAuth Popup Blocked
**Solution**: Allow popups for localhost in your browser

### "Connection canceled"
**Solution**: Make sure you grant all permissions in Google OAuth screen

### Events Not Syncing
**Check**:
```sql
-- Check for failed syncs
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Check error messages
SELECT error_message FROM google_calendar_sync_queue 
WHERE status = 'failed';
```

### Cron Job Not Running
**Check**:
```sql
-- Check cron job status
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'google-calendar-sync')
ORDER BY start_time DESC 
LIMIT 10;
```

### Edge Functions Not Deployed
**Solution**: You need to deploy the Edge Functions via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function
3. Copy code from `supabase/functions/google-calendar-auth/index.ts`
4. Deploy
5. Repeat for `google-calendar-sync` and `google-calendar-worker`

---

## ✅ Success Criteria

You'll know everything is working when:

- ✅ OAuth connection shows your email
- ✅ Study sessions appear in Google Calendar with 📚 emoji
- ✅ Tasks appear in Google Calendar with ✅ emoji
- ✅ Updates sync within 5 minutes
- ✅ Deletions remove events from Google Calendar
- ✅ Events have 10-minute reminders
- ✅ Sync queue shows `status = 'completed'`

---

## 📊 Monitoring Queries

Save these for ongoing monitoring:

```sql
-- Check sync queue status
SELECT 
  status,
  COUNT(*) as count
FROM google_calendar_sync_queue
GROUP BY status;

-- Check recent syncs
SELECT 
  event_type,
  operation,
  status,
  created_at,
  processed_at
FROM google_calendar_sync_queue
ORDER BY created_at DESC
LIMIT 20;

-- Check failed syncs
SELECT 
  event_type,
  operation,
  error_message,
  retry_count,
  created_at
FROM google_calendar_sync_queue
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Check connected users
SELECT 
  COUNT(*) as connected_users
FROM user_settings
WHERE google_calendar_connected = true;
```

---

## 🎯 Next Steps

After successful testing:

1. **Deploy to Production**:
   - Update `.env` with production redirect URI
   - Add production URI to Google Cloud Console
   - Deploy to Vercel/hosting
   - Test in production

2. **Monitor**:
   - Check sync queue regularly
   - Monitor Edge Function logs
   - Watch for failed syncs

3. **Optimize**:
   - Adjust cron frequency if needed
   - Add more error handling
   - Implement retry logic improvements

---

**Start with Test 1 and work your way through! Let me know if anything doesn't work as expected. 🚀**
