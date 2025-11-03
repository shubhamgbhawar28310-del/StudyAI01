# 🔧 Alternative: Skip Database Cron, Use External Service

## The Issue

The `pg_net` extension is enabled but the cron job can't access the `net` schema. This is a common permission issue with Supabase's managed PostgreSQL.

## ✅ Best Solution: Use External Cron Service

Instead of fighting with database permissions, let's use a more reliable external cron service. This is actually **better** because:
- ✅ More reliable (not dependent on database)
- ✅ Easier to monitor
- ✅ Works on all Supabase plans
- ✅ No permission issues

---

## Option 1: Cron-job.org (Easiest - 5 minutes)

**Free, reliable, and simple!**

### Steps:

1. **Go to**: https://cron-job.org/
2. **Sign up** for free account
3. **Create new cron job**:
   - **Title**: Google Calendar Sync
   - **URL**: `https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker`
   - **Schedule**: Every 5 minutes
   - **Request Method**: POST
   - **Headers**: 
     - Name: `Authorization`
     - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0`
4. **Save and enable**

**Done!** The service will call your worker function every 5 minutes.

---

## Option 2: GitHub Actions (If using GitHub)

Create `.github/workflows/google-calendar-sync.yml`:

```yaml
name: Google Calendar Sync

on:
  schedule:
    # Runs every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Google Calendar Worker
        run: |
          curl -X POST \
            https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

**Setup**:
1. Add secret `SUPABASE_ANON_KEY` to your GitHub repo
2. Commit the workflow file
3. GitHub will run it every 5 minutes

---

## Option 3: Simple Node.js Script (Run locally or on server)

Create `sync-worker.js`:

```javascript
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://crdqpioymuvnzhtgrenj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0';

async function triggerSync() {
  try {
    console.log(`[${new Date().toISOString()}] Triggering sync...`);
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/google-calendar-worker`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Sync result:`, data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Sync error:`, error.message);
  }
}

// Run every 5 minutes
setInterval(triggerSync, 5 * 60 * 1000);

// Run immediately on start
triggerSync();

console.log('Google Calendar sync worker started. Running every 5 minutes...');
```

**Run it**:
```bash
npm install node-fetch
node sync-worker.js
```

Keep it running in the background or use PM2:
```bash
npm install -g pm2
pm2 start sync-worker.js --name google-calendar-sync
pm2 save
```

---

## Option 4: Vercel Cron Jobs (If using Vercel)

If your frontend is on Vercel, add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/google-calendar-sync",
    "schedule": "*/5 * * * *"
  }]
}
```

Create `pages/api/google-calendar-sync.js`:

```javascript
export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---

## Option 5: Fix Database Cron (Advanced)

If you really want to use database cron, try this:

```sql
-- Delete old cron job
SELECT cron.unschedule('google-calendar-sync');

-- Grant all permissions
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres;

-- Recreate with explicit schema
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"}'::jsonb
  );
  $$
);
```

---

## 🎯 Recommendation

**Use Option 1 (Cron-job.org)** - It's:
- ✅ Free
- ✅ Reliable
- ✅ Easy to set up (5 minutes)
- ✅ Has monitoring dashboard
- ✅ No permission issues
- ✅ Works immediately

---

## ✅ After Setting Up External Cron

1. **Disable database cron** (to avoid conflicts):
```sql
SELECT cron.unschedule('google-calendar-sync');
```

2. **Test the worker function manually**:
```bash
curl -X POST \
  https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"
```

3. **Monitor sync queue**:
```sql
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📊 Comparison

| Method | Reliability | Setup Time | Cost | Monitoring |
|--------|-------------|------------|------|------------|
| Database Cron | ⚠️ Medium | 10 min | Free | Limited |
| Cron-job.org | ✅ High | 5 min | Free | ✅ Dashboard |
| GitHub Actions | ✅ High | 10 min | Free | ✅ Logs |
| Node.js Script | ✅ High | 5 min | Free | Custom |
| Vercel Cron | ✅ High | 10 min | Free* | ✅ Logs |

*Vercel cron requires Pro plan for production

---

**I recommend using Cron-job.org - it's the easiest and most reliable! 🚀**
