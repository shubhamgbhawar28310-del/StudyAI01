# 🚀 Easiest Cron Solution - EasyCron (Free POST Support)

## Problem
Cron-job.org free tier doesn't support POST requests.

## ✅ Best Free Alternative: EasyCron

**EasyCron** supports POST requests on the free tier!

### Setup (5 minutes):

1. **Go to**: https://www.easycron.com/
2. **Sign up** for free account (no credit card needed)
3. **Click "Add Cron Job"**
4. **Fill in**:
   - **Cron Expression**: `*/5 * * * *` (every 5 minutes)
   - **URL**: `https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker`
   - **HTTP Method**: Select **POST**
   - **HTTP Headers**: Click "Add Header"
     - Name: `Authorization`
     - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0`
5. **Save**

**Done!** ✅

---

## Alternative 1: cron-job.de (German service, supports POST)

1. **Go to**: https://cron-job.de/
2. **Sign up** (free)
3. **Create job** with POST method support
4. Same URL and headers as above

---

## Alternative 2: Simple Node.js Script (Best for Development)

Create `sync-worker.js` in your project:

```javascript
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
    console.log(`[${new Date().toISOString()}] Result:`, data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
  }
}

// Run every 5 minutes
setInterval(triggerSync, 5 * 60 * 1000);
triggerSync(); // Run immediately

console.log('✅ Google Calendar sync worker started!');
console.log('Running every 5 minutes...');
```

**Run it**:
```bash
node sync-worker.js
```

**Keep it running** (optional):
```bash
# Install PM2
npm install -g pm2

# Start the worker
pm2 start sync-worker.js --name google-calendar-sync

# Save PM2 config
pm2 save

# Set PM2 to start on boot
pm2 startup
```

---

## Alternative 3: GitHub Actions (If using GitHub)

Create `.github/workflows/google-calendar-sync.yml`:

```yaml
name: Google Calendar Sync

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST \
            https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

**Setup**:
1. Go to your GitHub repo
2. Settings → Secrets → Actions
3. Add secret: `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Commit the workflow file
5. Done! GitHub will run it every 5 minutes

---

## Alternative 4: Render Cron Jobs (Free)

If you have a Render account:

1. Create a new **Cron Job** service
2. Command: 
```bash
curl -X POST https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"
```
3. Schedule: `*/5 * * * *`

---

## Alternative 5: Railway Cron Jobs (Free)

Similar to Render, Railway also supports cron jobs.

---

## 🎯 My Recommendations

### For Quick Testing (Right Now)
**Use the Node.js script** - Just run `node sync-worker.js` and keep the terminal open. Perfect for testing!

### For Production (Long Term)
**Use EasyCron** or **GitHub Actions** - Both are free and reliable.

---

## 📊 Comparison

| Service | Free POST | Setup Time | Reliability | Monitoring |
|---------|-----------|------------|-------------|------------|
| EasyCron | ✅ Yes | 5 min | ✅ High | ✅ Dashboard |
| cron-job.de | ✅ Yes | 5 min | ✅ High | ✅ Dashboard |
| Node.js Script | ✅ Yes | 2 min | ⚠️ Medium* | Custom |
| GitHub Actions | ✅ Yes | 10 min | ✅ High | ✅ Logs |
| Render Cron | ✅ Yes | 10 min | ✅ High | ✅ Logs |

*Medium reliability because it requires your computer/server to be running

---

## 🚀 Quick Start (Node.js Script)

**Fastest way to get it working right now:**

1. Create `sync-worker.js` (code above)
2. Run: `node sync-worker.js`
3. Leave terminal open
4. Test by creating a study session
5. Wait 5 minutes
6. Check Google Calendar!

**Later**, you can move to EasyCron or GitHub Actions for production.

---

## ✅ After Setting Up

1. **Disable database cron**:
```sql
SELECT cron.unschedule('google-calendar-sync');
```

2. **Test manually**:
```bash
curl -X POST \
  https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"
```

3. **Monitor**:
```sql
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

---

**I recommend starting with the Node.js script for immediate testing, then moving to EasyCron for production! 🚀**
