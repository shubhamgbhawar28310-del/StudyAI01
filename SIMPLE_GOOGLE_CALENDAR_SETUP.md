# 🚀 Simple Google Calendar Setup (No CLI, No Edge Functions)

## Simplified Approach for Quick Testing

Let's get Google Calendar working with a simpler approach that doesn't require Supabase CLI or Edge Functions deployment right away.

---

## ⚡ Quick Setup (10 minutes)

### Step 1: Google Cloud Console (5 min)

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google Calendar API:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click Enable

4. Create OAuth 2.0 Credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: StudyAI
   - Authorized redirect URIs:
     ```
     http://localhost:5173/auth/google/callback
     ```
   - Click Create

5. **Copy your Client ID and Client Secret**

---

### Step 2: Update Environment Variables (1 min)

Update your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

---

### Step 3: Run Database Migrations (2 min)

1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Click **SQL Editor**
4. Click **New query**
5. Copy the entire contents of `supabase/migrations/GOOGLE_CALENDAR_SETUP.sql`
6. Paste and click **Run**
7. Create another new query
8. Copy the entire contents of `supabase/migrations/GOOGLE_CALENDAR_AUTO_SYNC.sql`
9. Paste and click **Run**

---

### Step 4: Deploy Edge Functions via Dashboard (2 min)

**Important**: Edge Functions require a Supabase Pro plan. If you're on the free tier, you have two options:

#### Option A: Upgrade to Pro (Recommended)
- Go to Project Settings → Billing
- Upgrade to Pro plan ($25/month)
- Then deploy functions via Dashboard

#### Option B: Use Alternative Method (Free Tier)
- For now, skip Edge Functions
- The OAuth connection will work
- Manual sync only (no automatic background sync)
- You can add Edge Functions later

---

### Step 5: Deploy Functions (If on Pro Plan)

1. In Supabase Dashboard, click **Edge Functions**
2. Click **Create a new function**

**Function 1: google-calendar-auth**
- Name: `google-calendar-auth`
- Copy code from: `supabase/functions/google-calendar-auth/index.ts`
- Paste and Deploy

**Function 2: google-calendar-sync**
- Name: `google-calendar-sync`
- Copy code from: `supabase/functions/google-calendar-sync/index.ts`
- Paste and Deploy

**Function 3: google-calendar-worker**
- Name: `google-calendar-worker`
- Copy code from: `supabase/functions/google-calendar-worker/index.ts`
- Paste and Deploy

---

### Step 6: Set Secrets (If using Edge Functions)

1. Go to **Project Settings** → **Edge Functions**
2. Scroll to **Secrets**
3. Add these:
   - `GOOGLE_CLIENT_ID`: your-client-id
   - `GOOGLE_CLIENT_SECRET`: your-client-secret
   - `GOOGLE_REDIRECT_URI`: http://localhost:5173/auth/google/callback

---

### Step 7: Test! (1 min)

1. Start your app:
   ```bash
   npm run dev
   ```

2. Go to **Settings → Notifications**

3. Click **"Connect Calendar"**

4. Sign in with Google

5. Grant permissions

6. You should see: **✅ Connected as your@gmail.com**

---

## 🎯 What Works Without Edge Functions

If you're on the free tier and skip Edge Functions:

✅ **OAuth Connection** - You can connect your Google Calendar
✅ **Connection Status** - Shows connected email
✅ **Disconnect** - Can disconnect anytime
❌ **Automatic Sync** - Won't sync events automatically
❌ **Background Worker** - No background processing

---

## 💡 Recommended Path

### For Development/Testing (Free Tier)
1. Complete Steps 1-3 above
2. Skip Edge Functions for now
3. Test the OAuth connection
4. Verify database schema is set up

### For Production (Pro Plan)
1. Upgrade to Supabase Pro
2. Deploy all 3 Edge Functions
3. Set up secrets
4. Set up cron job
5. Full automatic sync works!

---

## 🔧 Alternative: Use Supabase CLI (If you want to try)

The npm global install doesn't work, but you can use npx:

```bash
# Use npx instead of global install
npx supabase login
npx supabase functions deploy google-calendar-auth
npx supabase functions deploy google-calendar-sync
npx supabase functions deploy google-calendar-worker
```

Or download the standalone binary:
- Windows: https://github.com/supabase/cli/releases
- Download `supabase_windows_amd64.zip`
- Extract and add to PATH

---

## 📊 Summary

| Feature | Free Tier (No Functions) | Pro Plan (With Functions) |
|---------|-------------------------|---------------------------|
| OAuth Connection | ✅ | ✅ |
| Show Connected Status | ✅ | ✅ |
| Disconnect | ✅ | ✅ |
| Auto-Sync Events | ❌ | ✅ |
| Background Worker | ❌ | ✅ |
| Token Refresh | ❌ | ✅ |
| Retry Logic | ❌ | ✅ |

---

## 🚀 Quick Start Commands

```bash
# 1. Start your app
npm run dev

# 2. Open browser
http://localhost:5173

# 3. Go to Settings → Notifications

# 4. Click "Connect Calendar"

# 5. Test the connection!
```

---

## ✅ What to Do Right Now

1. **Complete Steps 1-3** (Google Cloud + Environment Variables + Database)
2. **Test the OAuth connection** (it will work without Edge Functions)
3. **Decide**: Free tier (basic connection) or Pro plan (full sync)
4. **If Pro**: Deploy Edge Functions via Dashboard
5. **If Free**: Use it for now, upgrade later when needed

---

**Start with Steps 1-3 and test the connection! You can add Edge Functions later. 🎉**
