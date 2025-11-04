# ⚡ Quick Fix: Google Calendar 400 Error

## 🎯 The Issue
Getting "400 - malformed request" when connecting Google Calendar with different email.

## ✅ Quick Fix (3 Steps)

### Step 1: Add Supabase Secrets (2 minutes)

1. Go to: https://supabase.com/dashboard
2. Your project → **Settings** → **Edge Functions**
3. Click **"Manage secrets"** or **"Add secret"**
4. Add these 3 secrets:

```
Name: GOOGLE_CLIENT_ID
Value: 272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com

Name: GOOGLE_CLIENT_SECRET
Value: [Get from Google Cloud Console]

Name: GOOGLE_REDIRECT_URI
Value: http://localhost:5173/auth/google/callback
```

### Step 2: Get Client Secret (1 minute)

1. Go to: https://console.cloud.google.com/
2. Your project → **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Copy the **Client Secret**
5. Paste it in Supabase (Step 1)

### Step 3: Deploy Edge Function (1 minute)

The code is already fixed. Just deploy it:

**Option A - Using Supabase Dashboard**:
1. Go to **Edge Functions** → `google-calendar-auth`
2. Copy the updated code from `supabase/functions/google-calendar-auth/index.ts`
3. Paste and click **Deploy**

**Option B - Using CLI** (if you have it):
```bash
supabase functions deploy google-calendar-auth
```

## 🧪 Test It

1. Clear browser cache (or use incognito)
2. Go to your app
3. Click "Connect Google Calendar"
4. Sign in with any Google account
5. Should work! ✓

## 🔍 What Was Wrong?

The `redirect_uri` parameter wasn't matching between:
- Initial OAuth request: `http://localhost:5173/auth/google/callback`
- Token exchange: Different or missing value

Google requires these to be **EXACTLY the same**.

## ✅ What Was Fixed?

1. ✅ Changed Content-Type to `application/x-www-form-urlencoded`
2. ✅ Added proper URL encoding
3. ✅ Ensured redirect_uri consistency
4. ✅ Added detailed error logging

## 🆘 Still Not Working?

Check these:

**1. Redirect URIs in Google Console**
Must have:
```
http://localhost:5173/auth/google/callback
https://studyai0.vercel.app/auth/google/callback
```

**2. Supabase Secrets**
All 3 secrets must be set:
- GOOGLE_CLIENT_ID ✓
- GOOGLE_CLIENT_SECRET ✓
- GOOGLE_REDIRECT_URI ✓

**3. Edge Function Logs**
Check for errors in Supabase Dashboard → Edge Functions → Logs

That's it! Your Google Calendar should connect now! 🎉