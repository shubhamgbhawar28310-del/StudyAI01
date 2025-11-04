# ⚡ Quick Fix: Edge Function Error

## 🎯 Problem
```
Edge Function returned a non-2xx status code
```

## ✅ Solution: Add Supabase Secrets (3 minutes)

### Step 1: Get Google Client Secret

1. Go to: https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. Click your OAuth Client ID
4. Copy **Client Secret** (click "Show")

### Step 2: Add Secrets to Supabase

1. Go to: https://supabase.com/dashboard
2. Your project → **Edge Functions** → **Manage Secrets**
3. Add these 5 secrets:

```
GOOGLE_CLIENT_ID
272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
[paste from Step 1]

GOOGLE_REDIRECT_URI
http://localhost:5173/auth/google/callback

SUPABASE_URL
https://crdqpioymuvnzhtgrenj.supabase.co

SUPABASE_SERVICE_ROLE_KEY
[Get from: Settings → API → service_role key]
```

### Step 3: Test

1. Wait 30 seconds (for secrets to load)
2. Try connecting Google Calendar again
3. Should work! ✓

## 📋 Checklist

- [ ] Got Client Secret from Google Console
- [ ] Added all 5 secrets to Supabase
- [ ] Waited 30 seconds
- [ ] Tested Google Calendar connection

## 🔍 Where to Find Service Role Key

1. Supabase Dashboard
2. **Settings** → **API**
3. Find **"service_role"** (NOT anon!)
4. Click "Reveal" and copy

## 🆘 Still Not Working?

Check Edge Function logs:
1. **Edge Functions** → `google-calendar-auth` → **Logs**
2. Look for error message
3. Verify all secrets are correct

That's it! Add the secrets and it'll work! 🚀