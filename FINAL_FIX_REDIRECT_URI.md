# ⚡ FINAL FIX: redirect_uri_mismatch

## 🎯 The Exact Fix You Need

Your `.env` file has:
```
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

Your Supabase Edge Function secret **MUST** have the EXACT same value.

## ✅ Do This Right Now (2 minutes):

### Step 1: Update Supabase Secret

1. **Go to**: https://supabase.com/dashboard/project/crdqpioymuvnzhtgrenj/functions
2. Click **"Manage secrets"** button (top right)
3. Find `GOOGLE_REDIRECT_URI` in the list
4. Click the **pencil/edit icon** next to it
5. **Delete the current value completely**
6. **Copy this EXACT value** (select and copy):
   ```
   http://localhost:5173/auth/google/callback
   ```
7. **Paste** into the value field
8. Click **"Update secret"** or **"Save"**

### Step 2: Verify Google Console

1. **Go to**: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, make sure you have:
   ```
   http://localhost:5173/auth/google/callback
   ```
4. If not there, click **"+ ADD URI"** and add it
5. Click **"SAVE"**

### Step 3: Test

1. **Wait 30 seconds** (for secret to update)
2. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```
3. **Open browser** → http://localhost:5173
4. **Open DevTools** (F12) → Console tab
5. **Try connecting Google Calendar**
6. **Check console logs** - should see:
   ```
   🚀 Initiating Google Calendar OAuth: {
     redirect_uri: "http://localhost:5173/auth/google/callback"
   }
   ```
7. **Check Supabase logs** - should see:
   ```
   🔍 Token exchange attempt: {
     redirect_uri: "http://localhost:5173/auth/google/callback"
   }
   ```
8. **Both should match!** ✓

## 🔍 If Still Not Working

Check the Supabase Edge Function logs:

1. Go to: https://supabase.com/dashboard/project/crdqpioymuvnzhtgrenj/functions
2. Click `google-calendar-auth`
3. Click **"Logs"** tab
4. Look for the `🔍 Token exchange attempt` log
5. Check what `redirect_uri` value it shows
6. If it's different from `http://localhost:5173/auth/google/callback`, the secret didn't update
7. Try deleting and re-adding the secret

## 📋 Quick Checklist

- [ ] Supabase secret `GOOGLE_REDIRECT_URI` = `http://localhost:5173/auth/google/callback`
- [ ] Google Console has `http://localhost:5173/auth/google/callback` in redirect URIs
- [ ] Waited 30 seconds after updating secret
- [ ] Restarted dev server
- [ ] Tested in browser
- [ ] Checked both console logs match

## 🎯 The Values MUST Be:

**Everywhere, use this EXACT value**:
```
http://localhost:5173/auth/google/callback
```

**NOT**:
- ❌ `http://localhost:5173/auth/google/callback/` (trailing slash)
- ❌ `https://localhost:5173/auth/google/callback` (https)
- ❌ `http://localhost:3000/auth/google/callback` (wrong port)
- ❌ `http://localhost:5173/auth/google/callback ` (space at end)

## 🚀 After This Fix

Your Google Calendar will:
- ✅ Complete OAuth successfully
- ✅ Exchange code for tokens
- ✅ Store tokens in database
- ✅ Enable calendar sync

Do these steps now and it will work! 🎉