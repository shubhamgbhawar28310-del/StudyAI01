# 🚀 Run the Sync Worker

## Quick Start (30 seconds)

I've created `sync-worker.js` for you. Just run it!

### Step 1: Run the Worker

```bash
node sync-worker.js
```

**That's it!** The worker will:
- ✅ Run immediately
- ✅ Sync every 5 minutes automatically
- ✅ Show logs for each sync
- ✅ Keep running until you stop it (Ctrl+C)

---

## What You'll See

```
🚀 Google Calendar Sync Worker Started!
📅 Running every 5 minutes...
⏹️  Press Ctrl+C to stop

[2025-11-03T13:15:00.000Z] 🔄 Triggering Google Calendar sync...
[2025-11-03T13:15:01.234Z] ✅ Sync completed successfully!
   - Processed: 3 events
   - Failed: 0 events

[2025-11-03T13:20:00.000Z] 🔄 Triggering Google Calendar sync...
[2025-11-03T13:20:01.456Z] ✅ Sync completed successfully!
   - Processed: 1 events
   - Failed: 0 events
```

---

## Testing

### 1. Start the Worker
```bash
node sync-worker.js
```

### 2. Create a Study Session
- Go to your app
- Create a new study session
- The worker will sync it within 5 minutes

### 3. Check Google Calendar
- Go to https://calendar.google.com
- Look for your event with 📚 emoji

---

## Keep It Running (Optional)

### Option 1: Keep Terminal Open
Just leave the terminal window open. Simple!

### Option 2: Use PM2 (Recommended for Production)

Install PM2:
```bash
npm install -g pm2
```

Start the worker:
```bash
pm2 start sync-worker.js --name google-calendar-sync
```

Useful PM2 commands:
```bash
# View logs
pm2 logs google-calendar-sync

# Stop the worker
pm2 stop google-calendar-sync

# Restart the worker
pm2 restart google-calendar-sync

# Remove the worker
pm2 delete google-calendar-sync

# List all PM2 processes
pm2 list

# Save PM2 config (survives reboots)
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

### Option 3: Run in Background (Windows)

Create `start-sync-worker.bat`:
```batch
@echo off
start /B node sync-worker.js
```

Double-click to run in background.

### Option 4: Run in Background (Mac/Linux)

```bash
nohup node sync-worker.js > sync-worker.log 2>&1 &
```

To stop:
```bash
pkill -f sync-worker.js
```

---

## Troubleshooting

### "fetch is not defined"
**Solution**: You need Node.js 18+ (fetch is built-in)

Check your version:
```bash
node --version
```

If < 18, install node-fetch:
```bash
npm install node-fetch
```

Then update `sync-worker.js` first line:
```javascript
const fetch = require('node-fetch');
```

### Worker Not Syncing
**Check**:
1. Edge Functions are deployed
2. Supabase secrets are set
3. Events exist in sync queue

**Debug**:
```sql
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### Connection Errors
**Check**:
- Internet connection
- Supabase project is running
- Edge Function URL is correct

---

## Monitoring

### Check Sync Queue
```sql
-- Pending syncs
SELECT COUNT(*) FROM google_calendar_sync_queue WHERE status = 'pending';

-- Recent syncs
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed syncs
SELECT * FROM google_calendar_sync_queue 
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check Worker Logs
If using PM2:
```bash
pm2 logs google-calendar-sync --lines 50
```

---

## Production Deployment

### Deploy to Render (Free)

1. Create `package.json`:
```json
{
  "name": "google-calendar-sync-worker",
  "version": "1.0.0",
  "scripts": {
    "start": "node sync-worker.js"
  }
}
```

2. Push to GitHub

3. Create new **Background Worker** on Render:
   - Connect your repo
   - Build command: (leave empty)
   - Start command: `npm start`

### Deploy to Railway (Free)

Similar to Render, Railway supports background workers.

### Deploy to Heroku

Create `Procfile`:
```
worker: node sync-worker.js
```

Deploy and scale the worker dyno.

---

## Alternative: GitHub Actions

If you prefer not to run a worker, use GitHub Actions:

Create `.github/workflows/google-calendar-sync.yml`:
```yaml
name: Google Calendar Sync

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST \
            https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

Add `SUPABASE_ANON_KEY` to GitHub Secrets.

---

## Summary

**For Development (Right Now)**:
```bash
node sync-worker.js
```
Leave terminal open. Done! ✅

**For Production (Later)**:
```bash
pm2 start sync-worker.js --name google-calendar-sync
pm2 save
```
Runs in background, auto-restarts. Done! ✅

---

## Next Steps

1. ✅ Run `node sync-worker.js`
2. ✅ Create a study session in your app
3. ✅ Wait 5 minutes
4. ✅ Check Google Calendar
5. ✅ Celebrate! 🎉

---

**Start the worker now and test it! 🚀**
