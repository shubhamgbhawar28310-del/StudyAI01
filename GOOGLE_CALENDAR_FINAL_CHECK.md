# 🔍 Google Calendar - Final Verification & Fix

## Current Status

✅ **Working**:
- Environment variables configured
- Edge Function `google-calendar-auth` deployed
- Sync worker running (PM2)
- Test user added

❌ **Issue**:
- `invalid_grant` error when connecting
- This means the redirect URI or secrets might not match

---

## 🎯 Step-by-Step Verification

### Step 1: Verify Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Check **Authorized redirect URIs**

**Must have EXACTLY**:
```
http://localhost:5173/auth/google/callback
```

**Common mistakes**:
- ❌ `https://localhost:5173/auth/google/callback` (https instead of http)
- ❌ `http://localhost:5173/auth/google/callback/` (trailing slash)
- ❌ `http://127.0.0.1:5173/auth/google/callback` (127.0.0.1 instead of localhost)

### Step 2: Verify Supabase Secrets

1. Go to: https://app.supabase.com/
2. Select your project
3. Go to: **Project Settings** → **Edge Functions** → **Secrets**

**Must have these 3 secrets**:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `GOOGLE_CLIENT_ID` | `272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your secret | From Google Cloud Console (keep private!) |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5173/auth/google/callback` | Type exactly |

### Step 3: Restart Dev Server

After I fixed the code, restart your dev server:

```bash
# Stop the server (Ctrl+C in the terminal running npm run dev)
# Start it again
npm run dev
```

### Step 4: Test Connection

1. Open: http://localhost:5173
2. Login to your app
3. Go to: **Settings** → **Notifications**
4. Click: **"Connect Calendar"**
5. Sign in with Google
6. Grant permissions
7. Should work! ✅

---

## 🔧 What I Just Fixed

I removed the call to `google-calendar-revoke` function (which doesn't exist). Now disconnect will work properly.

---

## 🐛 If Still Getting "invalid_grant"

### Check 1: Verify Client ID Matches

Run this in your browser console (F12):
```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

Should show: `272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com`

### Check 2: Verify Redirect URI Matches

Run this in browser console:
```javascript
console.log(import.meta.env.VITE_GOOGLE_REDIRECT_URI);
```

Should show: `http://localhost:5173/auth/google/callback`

### Check 3: Check Edge Function Logs

1. Go to Supabase Dashboard
2. **Edge Functions** → `google-calendar-auth`
3. Click **"Logs"** tab
4. Look for the exact error message

### Check 4: Test with Fresh OAuth

1. Go to Google Account: https://myaccount.google.com/permissions
2. Find "StudyAI" in the list
3. Click "Remove access"
4. Go back to your app
5. Try connecting again (will ask for permissions again)

---

## 📊 Verification Checklist

Run through this checklist:

- [ ] Google Cloud Console has redirect URI: `http://localhost:5173/auth/google/callback`
- [ ] Supabase has secret: `GOOGLE_CLIENT_ID`
- [ ] Supabase has secret: `GOOGLE_CLIENT_SECRET`
- [ ] Supabase has secret: `GOOGLE_REDIRECT_URI` = `http://localhost:5173/auth/google/callback`
- [ ] `.env` file has `VITE_GOOGLE_CLIENT_ID`
- [ ] `.env` file has `VITE_GOOGLE_REDIRECT_URI`
- [ ] Dev server restarted after code changes
- [ ] Edge Function `google-calendar-auth` is deployed
- [ ] Edge Function `google-calendar-sync` is deployed
- [ ] Edge Function `google-calendar-worker` is deployed
- [ ] Test user added in Google Cloud Console
- [ ] Trying in incognito/private window

---

## 🎯 Most Common Issue: Redirect URI Mismatch

The `invalid_grant` error is **almost always** caused by redirect URI mismatch.

**Triple check these match EXACTLY**:

1. **Google Cloud Console** → OAuth Client → Authorized redirect URIs
2. **Supabase** → Edge Functions → Secrets → `GOOGLE_REDIRECT_URI`
3. **Your `.env`** → `VITE_GOOGLE_REDIRECT_URI`

All three must be:
```
http://localhost:5173/auth/google/callback
```

No differences in:
- Protocol (http vs https)
- Domain (localhost vs 127.0.0.1)
- Port (5173)
- Path (/auth/google/callback)
- Trailing slash (none)

---

## 🧪 Manual Test

Test if the Edge Function is accessible:

```bash
curl -X POST https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-auth \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0" \
  -H "Content-Type: application/json" \
  -d '{"code":"test","userId":"test"}'
```

Should return an error (because code is invalid) but confirms function is accessible.

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ No "invalid_grant" error
2. ✅ No CORS errors
3. ✅ See "✅ Connected as your@email.com"
4. ✅ Button changes to "Disconnect"
5. ✅ Database shows `google_calendar_connected = true`

Check database:
```sql
SELECT 
  google_calendar_connected,
  google_calendar_email,
  google_calendar_token IS NOT NULL as has_token,
  google_calendar_refresh_token IS NOT NULL as has_refresh_token
FROM user_settings
WHERE user_id = '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62';
```

---

## 🚀 Next Steps After Connection Works

Once connected:
1. Create a study session
2. Wait 5 minutes (worker syncs every 5 minutes)
3. Check Google Calendar
4. Should see: 📚 Your Study Session

---

**Restart your dev server and try connecting again! 🚀**
