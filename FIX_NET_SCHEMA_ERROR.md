# 🔧 Fix: Schema "net" does not exist

## The Problem

Your cron job is failing with:
```
ERROR: schema "net" does not exist
LINE 2: SELECT net.http_post(^
```

This means the `pg_net` extension isn't enabled. This extension is required for making HTTP requests from PostgreSQL.

---

## ✅ Quick Fix (2 minutes)

### Step 1: Enable pg_net Extension

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Click **Database** in the left sidebar
4. Click **Extensions**
5. Search for **pg_net**
6. Click the toggle to **Enable** it
7. Wait a few seconds for it to activate

**Option B: Via SQL Editor**

1. Go to **SQL Editor**
2. Click **New query**
3. Run this:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```
4. Click **Run**

---

### Step 2: Verify Extension is Enabled

Run this in SQL Editor:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

You should see a row with `pg_net` listed.

---

### Step 3: Test the Extension

Run this to make sure it works:
```sql
SELECT net.http_get('https://httpbin.org/get');
```

If it returns data, the extension is working! ✅

---

### Step 4: Wait for Next Cron Run

The cron job runs every 5 minutes. Wait up to 5 minutes, then check:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'google-calendar-sync')
ORDER BY start_time DESC 
LIMIT 5;
```

**Expected**: The `status` should now be `succeeded` instead of `failed`.

---

## 🎯 Quick Commands

I've created a file with all the SQL you need: **`ENABLE_PG_NET.sql`**

Just run it in SQL Editor!

---

## ✅ Verification

After enabling pg_net, verify everything works:

### 1. Check Extension is Enabled
```sql
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');
```

**Expected**: Both `pg_cron` and `pg_net` should be listed.

### 2. Check Cron Job Status
```sql
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'google-calendar-sync';
```

**Expected**: Job should be `active = true`.

### 3. Check Recent Runs (After 5 minutes)
```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'google-calendar-sync')
ORDER BY start_time DESC 
LIMIT 5;
```

**Expected**: Latest run should have `status = 'succeeded'`.

---

## 🐛 Troubleshooting

### "Extension pg_net is not available"

**Possible Causes**:
1. Your Supabase plan doesn't support pg_net
2. Extension not installed on your Supabase instance

**Solutions**:

**Option 1: Contact Supabase Support**
- Some plans may need pg_net enabled by support
- Open a support ticket

**Option 2: Use Alternative Cron Method**

Instead of using pg_net from the database, use an external cron service:

**A. Vercel Cron Jobs** (if using Vercel)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/google-calendar-sync",
    "schedule": "*/5 * * * *"
  }]
}
```

**B. GitHub Actions**
```yaml
# .github/workflows/sync.yml
name: Google Calendar Sync
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST \
            https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
            -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**C. Cron-job.org** (Free service)
1. Go to https://cron-job.org/
2. Create free account
3. Add new cron job:
   - URL: `https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker`
   - Schedule: Every 5 minutes
   - Method: POST
   - Headers: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**D. Simple Node.js Script** (Run locally or on server)
```javascript
// sync-worker.js
const fetch = require('node-fetch');

async function triggerSync() {
  const response = await fetch(
    'https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  );
  console.log('Sync triggered:', response.status);
}

// Run every 5 minutes
setInterval(triggerSync, 5 * 60 * 1000);
triggerSync(); // Run immediately
```

---

## 📊 What Each Extension Does

### pg_cron
- Schedules jobs to run at specific times
- Like a cron job inside PostgreSQL
- Runs SQL commands on a schedule

### pg_net
- Makes HTTP requests from PostgreSQL
- Allows database to call external APIs
- Used by pg_cron to trigger Edge Functions

**Both are needed** for the automatic sync to work!

---

## 🎯 Summary

1. **Enable pg_net** (via Dashboard or SQL)
2. **Verify it's enabled** (check pg_extension table)
3. **Wait 5 minutes** (for next cron run)
4. **Check cron status** (should be succeeded)
5. **If pg_net not available** (use external cron service)

---

## ✅ After Fixing

Once pg_net is enabled:
- ✅ Cron job will run successfully every 5 minutes
- ✅ It will call the google-calendar-worker Edge Function
- ✅ Events will sync automatically to Google Calendar
- ✅ No more "schema net does not exist" errors

---

**Enable pg_net now and wait 5 minutes to see if the cron job succeeds! 🚀**
