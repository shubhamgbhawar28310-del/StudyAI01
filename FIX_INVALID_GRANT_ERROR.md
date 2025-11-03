# 🔧 Fix: Invalid Grant Error

## The Error

```
Token exchange failed: {
  "error": "invalid_grant",
  "error_description": "Bad Request"
}
```

## What This Means

✅ **Good news**: Edge Function is deployed and working!
❌ **Issue**: The authorization code is invalid or expired

## Common Causes

1. **Authorization code used twice** - OAuth codes can only be used once
2. **Code expired** - Codes expire after ~10 minutes
3. **Redirect URI mismatch** - The URI in the request doesn't match Google Cloud Console
4. **Time sync issue** - Server time is off

## ✅ Solutions

### Solution 1: Try Again (Most Common Fix)

The authorization code expires quickly. Just try connecting again:

1. **Refresh your app** (Ctrl+R)
2. Go to **Settings → Notifications**
3. Click **"Connect Calendar"** again
4. Sign in with Google
5. Grant permissions
6. Should work this time! ✅

### Solution 2: Check Redirect URI

Make sure the redirect URI matches **exactly** in:

**Google Cloud Console**:
- Go to: https://console.cloud.google.com/apis/credentials
- Click your OAuth Client ID
- Check "Authorized redirect URIs"
- Should have: `http://localhost:5173/auth/google/callback`

**Supabase Secrets**:
- Go to: Project Settings → Edge Functions → Secrets
- Check `GOOGLE_REDIRECT_URI`
- Should be: `http://localhost:5173/auth/google/callback`

**Frontend .env**:
- Check your `.env` file
- Should have: `VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback`

All three must match **exactly** (including http vs https, trailing slashes, etc.)

### Solution 3: Clear Browser Cache

Sometimes old OAuth data gets cached:

1. Open browser in **Incognito/Private mode**
2. Go to your app
3. Try connecting Google Calendar
4. Should work in incognito

### Solution 4: Regenerate OAuth Credentials

If still not working, create new credentials:

1. Go to Google Cloud Console
2. Delete old OAuth Client ID
3. Create new OAuth Client ID
4. Update `.env` with new Client ID
5. Update Supabase secrets with new Client ID and Secret
6. Try again

---

## 🧪 Testing Steps

### Step 1: Verify Secrets Are Set

Check in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

- ✅ `GOOGLE_CLIENT_ID` is set
- ✅ `GOOGLE_CLIENT_SECRET` is set
- ✅ `GOOGLE_REDIRECT_URI` is set

### Step 2: Verify Environment Variables

Check your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

### Step 3: Restart Dev Server

After changing `.env`:

```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

### Step 4: Try in Incognito

1. Open incognito window
2. Go to http://localhost:5173
3. Login to your app
4. Try connecting Google Calendar

---

## 🔍 Debug Checklist

- [ ] Edge Function `google-calendar-auth` is deployed
- [ ] All 3 secrets are set in Supabase
- [ ] `.env` has correct `VITE_GOOGLE_CLIENT_ID`
- [ ] `.env` has correct `VITE_GOOGLE_REDIRECT_URI`
- [ ] Redirect URI matches in Google Cloud Console
- [ ] Redirect URI matches in Supabase secrets
- [ ] Redirect URI matches in `.env`
- [ ] Dev server restarted after changing `.env`
- [ ] Tried in incognito mode
- [ ] Authorization code is fresh (not reused)

---

## 📊 Common Redirect URI Mistakes

### ❌ Wrong
```
http://localhost:5173/auth/google/callback/
https://localhost:5173/auth/google/callback
http://localhost:5174/auth/google/callback
http://127.0.0.1:5173/auth/google/callback
```

### ✅ Correct
```
http://localhost:5173/auth/google/callback
```

**Must be**:
- `http` (not https for localhost)
- `localhost` (not 127.0.0.1)
- Port `5173` (default Vite port)
- No trailing slash

---

## 🎯 Most Likely Fix

**Just try connecting again!** OAuth codes expire quickly. The error usually happens when:
1. You took too long to complete the flow
2. You refreshed the page during OAuth
3. You clicked "Connect" multiple times

**Solution**: Click "Connect Calendar" again and complete it quickly.

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ No "invalid_grant" error in Edge Function logs
2. ✅ See "Connected as your@email.com" in UI
3. ✅ `google_calendar_connected = true` in database
4. ✅ Token stored in `user_settings` table

---

## 🆘 Still Not Working?

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Edge Functions → `google-calendar-auth`
3. Click "Logs" tab
4. Look for detailed error messages

### Check Database

```sql
SELECT 
  google_calendar_connected,
  google_calendar_email,
  google_calendar_token IS NOT NULL as has_token
FROM user_settings
WHERE user_id = 'your-user-id';
```

### Manual Test

Test the Edge Function directly:

```bash
curl -X POST https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-auth \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code":"test","userId":"test"}'
```

Should return an error (because code is invalid) but confirms function is accessible.

---

**Try connecting again - it should work this time! 🚀**
