# 🔄 Sync Study Planner to Google Calendar

## 🎯 How It Works

Your Study Planner events are synced to Google Calendar through a queue system:

```
Study Planner Event Created
         ↓
Added to google_calendar_sync_queue
         ↓
Worker processes queue (every 5 minutes or manual)
         ↓
Event appears in Google Calendar ✓
```

## ⚡ Manual Sync (Right Now)

### Method 1: Call the Worker Function Directly

**Using curl** (Terminal/Command Prompt):
```bash
curl -X POST https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Replace `YOUR_ANON_KEY` with your Supabase anon key from `.env`:
```bash
curl -X POST https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"
```

**Using PowerShell** (Windows):
```powershell
Invoke-RestMethod -Uri "https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker" `
  -Method POST `
  -Headers @{"Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"}
```

### Method 2: Use Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/crdqpioymuvnzhtgrenj/functions
2. Click on `google-calendar-worker`
3. Click **"Invoke"** or **"Test"** button
4. Click **"Run"**
5. Check the response - should show how many events were synced

### Method 3: Add a Sync Button to Your App

I can add a "Sync Now" button to your Study Planner that triggers the worker.

## 🔄 Automatic Sync (Set Up Cron Job)

### Option A: Supabase Cron (Recommended)

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/crdqpioymuvnzhtgrenj/database/cron-jobs

2. **Create New Cron Job**:
   - Click **"Create a new cron job"**
   - Name: `sync-google-calendar`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - SQL Command:
   ```sql
   SELECT
     net.http_post(
       url:='https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     ) as request_id;
   ```
   - Replace `YOUR_SERVICE_ROLE_KEY` with your service role key
   - Click **"Create"**

### Option B: External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (if you have a repo)

Set it to call:
```
POST https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker
```
Every 5 minutes.

## 🧪 Test the Sync

### Step 1: Check Sync Queue

Run this SQL in Supabase:
```sql
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

This shows events waiting to be synced.

### Step 2: Trigger Manual Sync

Use one of the methods above to trigger the worker.

### Step 3: Check Results

Run this SQL:
```sql
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'completed'
ORDER BY processed_at DESC
LIMIT 10;
```

Should show recently synced events.

### Step 4: Check Google Calendar

Open Google Calendar - your Study Planner events should appear!

## 🔍 Troubleshooting

### Issue: No events in queue

**Check if events are being added**:
```sql
SELECT COUNT(*) FROM google_calendar_sync_queue;
```

If 0, events aren't being added to the queue. Check the database trigger.

### Issue: Events stuck in "pending"

**Manually trigger the worker** using Method 1 or 2 above.

### Issue: Events marked as "failed"

**Check error messages**:
```sql
SELECT id, event_type, operation, error_message, retry_count
FROM google_calendar_sync_queue 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

Common errors:
- Token expired: Reconnect Google Calendar
- Invalid event data: Check event format
- API quota exceeded: Wait and retry

### Issue: Worker returns error

**Check Edge Function logs**:
1. Supabase Dashboard → Edge Functions → `google-calendar-worker` → Logs
2. Look for error messages

## 📊 Monitor Sync Status

### Check Sync Statistics

```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM google_calendar_sync_queue
GROUP BY status;
```

### Check Recent Syncs

```sql
SELECT 
  event_type,
  operation,
  status,
  created_at,
  processed_at,
  error_message
FROM google_calendar_sync_queue
ORDER BY created_at DESC
LIMIT 20;
```

## 🎯 Quick Commands

**Sync Now** (PowerShell):
```powershell
Invoke-RestMethod -Uri "https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker" -Method POST -Headers @{"Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"}
```

**Check Queue**:
```sql
SELECT * FROM google_calendar_sync_queue WHERE status = 'pending';
```

**Reset Failed Events** (to retry):
```sql
UPDATE google_calendar_sync_queue 
SET status = 'pending', retry_count = 0, error_message = NULL
WHERE status = 'failed';
```

## 🚀 Best Practice

1. **Set up automatic sync** (cron job every 5 minutes)
2. **Monitor the queue** occasionally
3. **Manual sync** when you need immediate sync
4. **Check Google Calendar** to verify events appear

Your Study Planner events will automatically sync to Google Calendar! 🎉