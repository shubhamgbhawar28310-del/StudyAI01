# ⚡ Quick Fix: Google OAuth on Vercel

## 🎯 Problem
Google login works locally but not on Vercel production.

## ✅ 3-Step Fix

### Step 1: Google Cloud Console (2 minutes)

1. Go to: https://console.cloud.google.com/
2. **APIs & Services** → **Credentials** → Your OAuth Client
3. Add these URLs:

**Authorized JavaScript origins**:
```
https://studyai0.vercel.app
https://crdqpioymuvnzhtgrenj.supabase.co
```

**Authorized redirect URIs**:
```
https://studyai0.vercel.app/dashboard
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

4. Click **Save**

### Step 2: Supabase Dashboard (1 minute)

1. Go to: https://supabase.com/dashboard
2. **Authentication** → **URL Configuration**
3. Set **Site URL**: `https://studyai0.vercel.app`
4. Add **Redirect URLs**:
   ```
   https://studyai0.vercel.app/dashboard
   https://studyai0.vercel.app/*
   ```
5. Click **Save**

### Step 3: Vercel Environment Variables (2 minutes)

1. Go to: https://vercel.com/dashboard
2. Your project → **Settings** → **Environment Variables**
3. Add these (if not already there):

```
VITE_SUPABASE_URL=https://crdqpioymuvnzhtgrenj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[from your .env]
VITE_GOOGLE_CLIENT_ID=272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
```

4. **Important**: Select **"Production"** for all
5. Click **Save**
6. **Redeploy** your app

## 🧪 Test It

1. Go to: https://studyai0.vercel.app/login
2. Click "Continue with Google"
3. Should work! ✓

## 🔍 Still Not Working?

Check these:

**1. Redirect URIs Match**
- Google Console has: `https://studyai0.vercel.app/dashboard`
- Supabase has: `https://studyai0.vercel.app/dashboard`

**2. Environment Variables Set**
- All variables in Vercel
- Set to "Production" environment
- Redeployed after adding

**3. Clear Browser Cache**
- Or test in incognito mode

## 📋 Quick Checklist

- [ ] Added production URLs to Google Console
- [ ] Updated Supabase Site URL
- [ ] Added environment variables to Vercel
- [ ] Redeployed on Vercel
- [ ] Tested on production URL

That's it! Your Google OAuth should work on Vercel now! 🎉

## 📚 Full Guide

For detailed troubleshooting, see: `FIX_GOOGLE_OAUTH_VERCEL.md`