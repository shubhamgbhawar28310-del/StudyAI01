# ✅ Google Calendar Integration Checklist

## Quick Setup Checklist

### 1. Google Cloud Console (5 minutes)
- [ ] Go to https://console.cloud.google.com/
- [ ] Create/select project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add redirect URIs:
  - [ ] `http://localhost:5173/auth/google/callback`
  - [ ] `https://your-app.vercel.app/auth/google/callback`
- [ ] Copy Client ID
- [ ] Copy Client Secret

### 2. Environment Variables
- [ ] Add to `.env`:
  ```env
  VITE_GOOGLE_CLIENT_ID=your-client-id-here
  VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
  ```
- [ ] Set Supabase secrets:
  ```bash
  supabase secrets set GOOGLE_CLIENT_ID=your-client-id
  supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret
  supabase secrets set GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/google/callback
  ```

### 3. Database Setup
- [ ] Run `GOOGLE_CALENDAR_SETUP.sql` in Supabase SQL Editor
- [ ] Run `GOOGLE_CALENDAR_AUTO_SYNC.sql` in Supabase SQL Editor
- [ ] Verify tables created:
  - [ ] `user_settings` has Google Calendar columns
  - [ ] `schedule_events` has sync columns
  - [ ] `tasks` has sync columns
  - [ ] `google_calendar_sync_queue` table exists
  - [ ] `google_calendar_sync_log` table exists

### 4. Deploy Edge Functions
- [ ] Deploy: `supabase functions deploy google-calendar-auth`
- [ ] Deploy: `supabase functions deploy google-calendar-sync`
- [ ] Deploy: `supabase functions deploy google-calendar-worker`
- [ ] Verify functions are running in Supabase Dashboard

### 5. Set Up Cron Job (Optional but Recommended)
- [ ] Choose cron method (Supabase Cron or external)
- [ ] Set up to call `google-calendar-worker` every 5 minutes
- [ ] Test cron job is working

### 6. Testing
- [ ] Start app: `npm run dev`
- [ ] Go to Settings → Notifications
- [ ] Click "Connect Calendar"
- [ ] Sign in with Google
- [ ] Grant permissions
- [ ] Verify: ✅ Connected as your@email.com
- [ ] Create a study session
- [ ] Check Google Calendar for event
- [ ] Update the study session
- [ ] Verify Google Calendar updated
- [ ] Delete the study session
- [ ] Verify removed from Google Calendar
- [ ] Create a task with deadline
- [ ] Check Google Calendar for task event
- [ ] Click "Disconnect Calendar"
- [ ] Verify: "Not connected"

### 7. Production Deployment
- [ ] Update `.env` with production redirect URI
- [ ] Add production redirect URI to Google Cloud Console
- [ ] Deploy frontend to Vercel/hosting
- [ ] Verify Edge Functions are deployed
- [ ] Test OAuth flow in production
- [ ] Monitor sync queue for errors

---

## Quick Commands

### Deploy Everything
```bash
# Deploy Edge Functions
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync
supabase functions deploy google-calendar-worker

# Push database migrations
supabase db push
```

### Check Sync Status
```sql
-- Check pending syncs
SELECT * FROM google_calendar_sync_queue WHERE status = 'pending';

-- Check failed syncs
SELECT * FROM google_calendar_sync_queue WHERE status = 'failed';

-- Check sync logs
SELECT * FROM google_calendar_sync_log ORDER BY created_at DESC LIMIT 10;
```

### Test Edge Functions Locally
```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve
```

---

## Troubleshooting Quick Fixes

### Redirect URI Mismatch
1. Copy exact URL from error message
2. Add to Google Cloud Console → Credentials → OAuth 2.0 Client IDs
3. Try again

### Token Expired
1. Disconnect calendar
2. Reconnect calendar
3. System will get fresh tokens

### Events Not Syncing
1. Check: `SELECT * FROM google_calendar_sync_queue WHERE status = 'failed'`
2. Check Supabase Edge Function logs
3. Verify cron job is running
4. Manually trigger: Call `google-calendar-worker` endpoint

### Permission Denied
1. Revoke app access in Google Account settings
2. Reconnect and grant all permissions

---

## Files Created

✅ **Frontend**
- `src/services/googleCalendarService.ts` - OAuth & API calls
- `src/pages/GoogleCalendarCallback.tsx` - OAuth callback handler
- `src/components/settings/NotificationSettings.tsx` - Updated with Connect button
- `src/App.tsx` - Added callback route

✅ **Backend**
- `supabase/migrations/GOOGLE_CALENDAR_SETUP.sql` - Database schema
- `supabase/migrations/GOOGLE_CALENDAR_AUTO_SYNC.sql` - Auto-sync triggers
- `supabase/functions/google-calendar-auth/index.ts` - OAuth handler
- `supabase/functions/google-calendar-sync/index.ts` - Sync operations
- `supabase/functions/google-calendar-worker/index.ts` - Background worker

✅ **Documentation**
- `GOOGLE_CALENDAR_COMPLETE_SETUP.md` - Full setup guide
- `GOOGLE_CALENDAR_CHECKLIST.md` - This checklist
- `.env.example` - Environment variables template

---

## Support Resources

- **Google Cloud Console**: https://console.cloud.google.com/
- **Google Calendar API Docs**: https://developers.google.com/calendar/api
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2

---

**Ready to go! Follow the checklist and you'll have Google Calendar integration working in no time! 🚀**
