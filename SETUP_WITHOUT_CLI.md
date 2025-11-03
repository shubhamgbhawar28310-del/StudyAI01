# 🚀 Google Calendar Setup Without Supabase CLI

## Quick Setup (No CLI Required)

Since you don't have Supabase CLI installed, here's how to set up Google Calendar integration using only the Supabase Dashboard.

---

## Step 1: Google Cloud Console (5 min)

1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Type: Web application
   - Redirect URIs:
     ```
     http://localhost:5173/auth/google/callback
     ```
3. Enable Google Calendar API:
   - APIs & Services → Library → Search "Google Calendar API" → Enable
4. Copy your Client ID and Client Secret

---

## Step 2: Add Environment Variables

Update your `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

---

## Step 3: Run Database Migrations

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Copy and paste the contents of `supabase/migrations/GOOGLE_CALENDAR_SETUP.sql`
6. Click "Run"
7. Create another new query
8. Copy and paste the contents of `supabase/migrations/GOOGLE_CALENDAR_AUTO_SYNC.sql`
9. Click "Run"

---

## Step 4: Deploy Edge Functions via Dashboard

### Deploy google-calendar-auth

1. In Supabase Dashboard, click "Edge Functions"
2. Click "Create a new function"
3. Function name: `google-calendar-auth`
4. Copy the entire code from `supabase/functions/google-calendar-auth/index.ts`
5. Paste into the editor
6. Click "Deploy"

### Deploy google-calendar-sync

1. Click "Create a new function"
2. Function name: `google-calendar-sync`
3. Copy the entire code from `supabase/functions/google-calendar-sync/index.ts`
4. Paste into the editor
5. Click "Deploy"

### Deploy google-calendar-worker

1. Click "Create a new function"
2. Function name: `google-calendar-worker`
3. Copy the entire code from `supabase/functions/google-calendar-worker/index.ts`
4. Paste into the editor
5. Click "Deploy"

---

## Step 5: Set Supabase Secrets

1. In Supabase Dashboard, go to "Project Settings"
2. Click "Edge Functions" in the left menu
3. Scroll to "Secrets"
4. Add these secrets:
   - Name: `GOOGLE_CLIENT_ID`, Value: your-client-id
   - Name: `GOOGLE_CLIENT_SECRET`, Value: your-client-secret
   - Name: `GOOGLE_REDIRECT_URI`, Value: http://localhost:5173/auth/google/callback

---

## Step 6: Set Up Cron Job

1. In Supabase Dashboard, click "Database"
2. Click "Extensions" in the left menu
3. Enable "pg_cron" extension if not already enabled
4. Go to "SQL Editor"
5. Run this SQL:

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

Replace:
- `YOUR-PROJECT-REF` with your Supabase project reference (found in Project Settings → API)
- `YOUR-ANON-KEY` with your anon/public key (found in Project Settings → API)

---

## Step 7: Test It!

1. Start your app: `npm run dev`
2. Go to Settings → Notifications
3. Click "Connect Calendar"
4. Sign in with Google
5. Create a study session
6. Check your Google Calendar!

---

## ✅ Verification Checklist

- [ ] Google OAuth credentials created
- [ ] Environment variables added to .env
- [ ] GOOGLE_CALENDAR_SETUP.sql executed
- [ ] GOOGLE_CALENDAR_AUTO_SYNC.sql executed
- [ ] google-calendar-auth function deployed
- [ ] google-calendar-sync function deployed
- [ ] google-calendar-worker function deployed
- [ ] Supabase secrets set
- [ ] Cron job created
- [ ] App running and tested

---

## 🆘 Troubleshooting

### Can't find Edge Functions in Dashboard
- Make sure you're on a paid Supabase plan (Edge Functions require Pro plan)
- Or use Supabase CLI with free tier

### Function deployment fails
- Check that you copied the entire code
- Make sure there are no syntax errors
- Check the function logs for errors

### OAuth not working
- Verify redirect URI matches exactly in Google Cloud Console
- Check that environment variables are set correctly
- Test in incognito mode

---

## 💡 Alternative: Install Supabase CLI

If you want to use the CLI (recommended for easier deployment):

```powershell
# Using npm
npm install -g supabase

# Then login
supabase login

# Then deploy
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync
supabase functions deploy google-calendar-worker
```

---

**You're all set! No CLI needed - everything can be done through the dashboard! 🎉**
