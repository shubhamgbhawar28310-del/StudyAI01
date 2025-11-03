# 🚀 START HERE - Google Calendar Integration

## ⚡ Quick Start (15 Minutes)

Everything is coded and ready! Just follow these 6 steps:

---

## Step 1: Google Cloud Console (5 min)

1. **Go to**: https://console.cloud.google.com/
2. **Create OAuth Client**:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Type: Web application
   - Redirect URIs:
     ```
     http://localhost:5173/auth/google/callback
     https://your-app.vercel.app/auth/google/callback
     ```
3. **Enable API**:
   - APIs & Services → Library → Search "Google Calendar API" → Enable
4. **Copy**:
   - Client ID
   - Client Secret

---

## Step 2: Add Environment Variables (2 min)

Create/update `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

---

## Step 3: Set Supabase Secrets (2 min)

```bash
supabase secrets set GOOGLE_CLIENT_ID=your-client-id
supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret
supabase secrets set GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

Or set in Supabase Dashboard: Project Settings → Edge Functions → Secrets

---

## Step 4: Run Database Migrations (2 min)

In Supabase SQL Editor, run these files in order:
1. `supabase/migrations/GOOGLE_CALENDAR_SETUP.sql`
2. `supabase/migrations/GOOGLE_CALENDAR_AUTO_SYNC.sql`

Or using CLI:
```bash
supabase db push
```

---

## Step 5: Deploy Edge Functions (2 min)

```bash
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync
supabase functions deploy google-calendar-worker
```

---

## Step 6: Set Up Cron Job (2 min)

**Option A: Supabase Cron (Recommended)**

Run this SQL in Supabase:
```sql
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer YOUR-ANON-KEY"}'::jsonb
  );
  $$
);
```

**Option B: Manual Trigger**

Call this endpoint every 5 minutes:
```
POST https://YOUR-PROJECT.supabase.co/functions/v1/google-calendar-worker
Authorization: Bearer YOUR-ANON-KEY
```

---

## ✅ Test It!

1. Start app: `npm run dev`
2. Go to Settings → Notifications
3. Click "Connect Calendar"
4. Sign in with Google
5. Create a study session
6. Check your Google Calendar! 🎉

---

## 📚 Documentation

- **Full Setup Guide**: `GOOGLE_CALENDAR_COMPLETE_SETUP.md`
- **Quick Checklist**: `GOOGLE_CALENDAR_CHECKLIST.md`
- **Flow Diagrams**: `GOOGLE_CALENDAR_FLOW_DIAGRAM.md`
- **Implementation Details**: `IMPLEMENTATION_COMPLETE.md`

---

## 🆘 Troubleshooting

**"Redirect URI mismatch"**
→ Add exact URL to Google Cloud Console

**"Events not syncing"**
→ Check cron job is running

**"Invalid token"**
→ Disconnect and reconnect

**More help**: See `GOOGLE_CALENDAR_COMPLETE_SETUP.md` → Troubleshooting section

---

## 🎯 What You Get

✅ One-click Google Calendar connection
✅ Auto-sync study sessions (📚)
✅ Auto-sync task deadlines (✅)
✅ 10-minute reminders on all events
✅ Real-time updates
✅ Automatic token refresh
✅ Reliable background syncing

---

**That's it! Follow the 6 steps and you're done! 🚀**
