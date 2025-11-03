# 🔧 Fix: Schema "cron" does not exist

## The Problem

You got this error:
```
ERROR: 3F000: schema "cron" does not exist
```

This means the `pg_cron` extension isn't enabled in your Supabase database yet.

---

## ✅ Solution (2 minutes)

### Step 1: Enable pg_cron Extension

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Click **Database** in the left sidebar
4. Click **Extensions**
5. Search for **pg_cron**
6. Click the toggle to **Enable** it
7. Wait a few seconds for it to activate

**Option B: Via SQL Editor**

1. Go to **SQL Editor**
2. Click **New query**
3. Run this:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```
4. Click **Run**

---

### Step 2: Verify Extension is Enabled

Run this in SQL Editor:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

You should see a row with `pg_cron` listed.

---

### Step 3: Create the Cron Job

Now run the cron schedule command again, but **replace the placeholders**:

```sql
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer YOUR-ANON-KEY"}'::jsonb
  );
  $$
);
```

**How to find YOUR-PROJECT-REF and YOUR-ANON-KEY:**

1. Go to **Project Settings** → **API**
2. **Project URL**: `https://YOUR-PROJECT-REF.supabase.co`
   - Copy the part before `.supabase.co`
3. **anon / public key**: Copy the long key under "Project API keys"

**Example:**
```sql
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://abcdefghijklmnop.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  );
  $$
);
```

---

### Step 4: Verify Cron Job Created

Run this to see your cron jobs:
```sql
SELECT * FROM cron.job;
```

You should see `google-calendar-sync` listed with schedule `*/5 * * * *`.

---

## 🎯 Quick Commands

I've created a file with all the SQL you need: **`ENABLE_CRON_EXTENSION.sql`**

Just:
1. Open that file
2. Replace `YOUR-PROJECT-REF` and `YOUR-ANON-KEY` with your actual values
3. Run it in SQL Editor

---

## ⚠️ Important Notes

### pg_cron Availability

- **Free Tier**: pg_cron is available but limited
- **Pro Plan**: Full pg_cron support
- **Alternative**: Use external cron service (see below)

### If pg_cron is Not Available

If you can't enable pg_cron (some Supabase plans), use an external cron service:

**Option 1: Vercel Cron Jobs** (if using Vercel)
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/google-calendar-sync",
    "schedule": "*/5 * * * *"
  }]
}
```

**Option 2: GitHub Actions**
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
            https://YOUR-PROJECT.supabase.co/functions/v1/google-calendar-worker \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

**Option 3: Cron-job.org** (Free service)
1. Go to https://cron-job.org/
2. Create free account
3. Add new cron job:
   - URL: `https://YOUR-PROJECT.supabase.co/functions/v1/google-calendar-worker`
   - Schedule: Every 5 minutes
   - Headers: `Authorization: Bearer YOUR-ANON-KEY`

---

## ✅ Verification

After setting up the cron job, verify it's working:

1. **Check cron job exists:**
```sql
SELECT * FROM cron.job;
```

2. **Check cron job history:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'google-calendar-sync')
ORDER BY start_time DESC 
LIMIT 10;
```

3. **Check sync queue:**
```sql
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'completed' 
ORDER BY processed_at DESC 
LIMIT 10;
```

---

## 🆘 Still Having Issues?

### "Extension pg_cron is not available"
**Solution**: Your Supabase plan might not support pg_cron. Use external cron service instead.

### "Permission denied for schema cron"
**Solution**: You need to be a superuser. Contact Supabase support or use external cron.

### "Cron job not running"
**Solution**: 
1. Check Edge Function is deployed
2. Verify the URL is correct
3. Check Edge Function logs for errors
4. Make sure anon key is correct

---

## 📝 Summary

1. **Enable pg_cron extension** (via Dashboard or SQL)
2. **Create cron job** (replace placeholders with your values)
3. **Verify it's working** (check cron.job table)
4. **Alternative**: Use external cron if pg_cron not available

---

**Try enabling pg_cron now and run the cron schedule command again! 🚀**
