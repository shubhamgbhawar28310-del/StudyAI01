# 📅 Google Calendar Integration - Complete Setup Guide

## ✅ What's Been Implemented

All the code for Google Calendar integration is now complete! Here's what's ready:

### Frontend
- ✅ Google Calendar service with OAuth flow (`src/services/googleCalendarService.ts`)
- ✅ OAuth callback page (`src/pages/GoogleCalendarCallback.tsx`)
- ✅ Updated NotificationSettings UI with Connect/Disconnect button
- ✅ Route added to App.tsx for OAuth callback

### Backend (Supabase)
- ✅ Database schema with Google Calendar fields (`GOOGLE_CALENDAR_SETUP.sql`)
- ✅ Auto-sync triggers for schedule events and tasks (`GOOGLE_CALENDAR_AUTO_SYNC.sql`)
- ✅ Sync queue table for reliable background processing
- ✅ Edge Function for OAuth token exchange (`google-calendar-auth`)
- ✅ Edge Function for calendar sync operations (`google-calendar-sync`)
- ✅ Background worker for processing sync queue (`google-calendar-worker`)

---

## 🚀 Setup Instructions (Your Part)

### Step 1: Google Cloud Console Setup (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google Calendar API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "StudyAI Calendar Sync"
   
4. **Configure Authorized Redirect URIs**
   Add these URLs (replace with your actual domains):
   ```
   http://localhost:5173/auth/google/callback
   https://your-app.vercel.app/auth/google/callback
   ```

5. **Copy Your Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**

---

### Step 2: Environment Variables

#### Frontend (.env file)
Create or update your `.env` file:

```env
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

For production, update `VITE_GOOGLE_REDIRECT_URI` to your production URL.

#### Supabase Edge Functions
Set these secrets in Supabase:

```bash
# Using Supabase CLI
supabase secrets set GOOGLE_CLIENT_ID=your-client-id-here
supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret-here
supabase secrets set GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/google/callback
```

Or set them in the Supabase Dashboard:
- Go to Project Settings → Edge Functions → Secrets
- Add each secret manually

---

### Step 3: Run Database Migrations

Run these SQL files in your Supabase SQL Editor (in order):

1. **GOOGLE_CALENDAR_SETUP.sql**
   - Adds Google Calendar fields to user_settings, schedule_events, and tasks
   - Creates sync_log table
   - Creates helper functions

2. **GOOGLE_CALENDAR_AUTO_SYNC.sql**
   - Creates sync queue table
   - Adds triggers for automatic syncing
   - Creates background processing functions

```bash
# Or using Supabase CLI
supabase db push
```

---

### Step 4: Deploy Edge Functions

Deploy the three Edge Functions:

```bash
# Deploy OAuth handler
supabase functions deploy google-calendar-auth

# Deploy sync handler
supabase functions deploy google-calendar-sync

# Deploy background worker
supabase functions deploy google-calendar-worker
```

---

### Step 5: Set Up Cron Job (Optional but Recommended)

For reliable background syncing, set up a cron job to call the worker:

**Option A: Supabase Cron (Recommended)**
Add to your Supabase project:

```sql
-- Run every 5 minutes
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Option B: External Cron Service**
Use services like:
- Vercel Cron Jobs
- GitHub Actions
- Cron-job.org

Call this endpoint every 5 minutes:
```
POST https://your-project.supabase.co/functions/v1/google-calendar-worker
Authorization: Bearer YOUR_ANON_KEY
```

---

## 🧪 Testing the Integration

### Test 1: Connect Google Calendar

1. Start your app: `npm run dev`
2. Go to Settings → Notifications
3. Click "Connect Calendar"
4. Sign in with Google
5. Grant calendar permissions
6. Should see: ✅ Connected as your@email.com

### Test 2: Sync a Study Session

1. Go to Study Planner
2. Create a new study session
3. Check your Google Calendar
4. Should see: 📚 [Session Title] with 10-minute reminder

### Test 3: Sync a Task Deadline

1. Go to Task Manager
2. Create a task with a deadline
3. Check your Google Calendar
4. Should see: ✅ [Task Title] with reminders

### Test 4: Update an Event

1. Edit a study session or task
2. Change the title or time
3. Check Google Calendar
4. Should see the updated event

### Test 5: Delete an Event

1. Delete a study session or task
2. Check Google Calendar
3. Event should be removed

### Test 6: Disconnect

1. Click "Disconnect Calendar"
2. Confirm disconnection
3. Should see: "Not connected"
4. Future events won't sync (existing events remain)

---

## 🔍 Troubleshooting

### "Redirect URI mismatch" Error
**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches your app URL.

### "Invalid token" Error
**Solution**: Token expired. The system should auto-refresh. If not, disconnect and reconnect.

### Events not syncing
**Solution**: 
1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Check the sync queue table: `SELECT * FROM google_calendar_sync_queue WHERE status = 'failed'`
4. Make sure the cron job is running

### "Permission denied" Error
**Solution**: User needs to grant calendar permission during OAuth flow.

### Duplicate events
**Solution**: Check that `google_event_id` is being stored correctly in the database.

---

## 📊 How It Works

### Architecture

```
User Action (Create/Update/Delete Event)
    ↓
Database Trigger Fires
    ↓
Event Added to Sync Queue
    ↓
Background Worker (Cron Job)
    ↓
Calls Google Calendar API
    ↓
Updates Database with google_event_id
    ↓
Marks as Synced
```

### Sync Queue

The system uses a queue-based approach for reliability:
- Events are added to `google_calendar_sync_queue` table
- Background worker processes the queue every 5 minutes
- Failed syncs are retried up to 3 times
- You can monitor sync status in the database

### Token Management

- Access tokens expire after 1 hour
- Refresh tokens are stored securely
- System automatically refreshes expired tokens
- Tokens are encrypted in the database

---

## 🎯 Features Implemented

✅ **OAuth 2.0 Authentication** - Secure Google sign-in
✅ **Automatic Sync** - Events sync in real-time
✅ **Study Sessions** - Synced with 📚 emoji
✅ **Task Deadlines** - Synced with ✅ emoji
✅ **10-Minute Reminders** - Added to all events
✅ **Update Sync** - Changes reflect in Google Calendar
✅ **Delete Sync** - Removed events deleted from calendar
✅ **Connection Status** - Shows connected email
✅ **Disconnect Option** - Easy to revoke access
✅ **Token Refresh** - Automatic token renewal
✅ **Error Handling** - Graceful fallbacks
✅ **Retry Logic** - Failed syncs are retried
✅ **Queue System** - Reliable background processing

---

## 📝 Database Tables

### user_settings (updated)
- `google_calendar_connected` - Boolean
- `google_calendar_email` - User's Google email
- `google_calendar_token` - Access token (encrypted)
- `google_calendar_refresh_token` - Refresh token (encrypted)
- `google_calendar_token_expires_at` - Token expiry timestamp
- `google_calendar_last_sync` - Last sync timestamp

### schedule_events (updated)
- `google_event_id` - Google Calendar event ID
- `synced_to_google` - Sync status
- `last_synced_at` - Last sync timestamp

### tasks (updated)
- `google_event_id` - Google Calendar event ID
- `synced_to_google` - Sync status
- `last_synced_at` - Last sync timestamp

### google_calendar_sync_queue (new)
- Queue for background sync processing
- Tracks pending, processing, completed, and failed syncs
- Includes retry logic and error messages

---

## 🔐 Security Notes

- ✅ Client Secret stored only in Supabase (never exposed to frontend)
- ✅ Tokens encrypted in database
- ✅ OAuth flow uses PKCE for security
- ✅ Minimal scopes requested (calendar + email only)
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Service role key used only in Edge Functions

---

## 🚀 Next Steps

1. Complete Google Cloud Console setup
2. Add environment variables
3. Run database migrations
4. Deploy Edge Functions
5. Set up cron job
6. Test the integration
7. Deploy to production

---

## 📞 Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test OAuth flow in incognito mode
5. Check the sync queue table for failed items

---

**Everything is ready! Just complete the setup steps above and you'll have full Google Calendar integration! 🎉**
