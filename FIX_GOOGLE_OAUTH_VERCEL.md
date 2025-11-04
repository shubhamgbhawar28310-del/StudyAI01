# 🚀 Fix Google OAuth on Vercel Production

## 🔍 The Problem

Google OAuth works locally (`http://localhost:5173`) but fails on Vercel (`https://studyai0.vercel.app`).

**Why?** Google requires you to whitelist EVERY domain where OAuth will be used.

## ✅ Complete Fix (3 Steps)

### Step 1: Add Production URLs to Google Cloud Console

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Edit OAuth Client**:
   - Go to: **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID**

3. **Add Production Redirect URIs**:

Click **"Add URI"** and add these:

```
✅ https://studyai0.vercel.app/dashboard
✅ https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

4. **Add Authorized JavaScript Origins**:

Click **"Add URI"** under "Authorized JavaScript origins":

```
✅ https://studyai0.vercel.app
✅ https://crdqpioymuvnzhtgrenj.supabase.co
```

5. **Your Complete Configuration Should Look Like**:

**Authorized JavaScript origins**:
```
http://localhost:5173                                    ← Local
https://studyai0.vercel.app                             ← Production
https://crdqpioymuvnzhtgrenj.supabase.co               ← Supabase
```

**Authorized redirect URIs**:
```
http://localhost:5173/dashboard                          ← Local (Supabase Auth)
http://localhost:5173/auth/google/callback              ← Local (Calendar)
https://studyai0.vercel.app/dashboard                   ← Production (Supabase Auth)
https://studyai0.vercel.app/auth/google/callback        ← Production (Calendar)
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback  ← Supabase
```

6. **Click "Save"**

### Step 2: Configure Supabase for Production

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Update Site URL**:
   - Go to: **Authentication** → **URL Configuration**
   - **Site URL**: `https://studyai0.vercel.app`
   - Click **Save**

3. **Add Redirect URLs**:
   - In the same section, find **Redirect URLs**
   - Add these (one per line):
   ```
   http://localhost:5173/dashboard
   https://studyai0.vercel.app/dashboard
   https://studyai0.vercel.app/*
   ```
   - Click **Save**

4. **Verify Google Provider Settings**:
   - Go to: **Authentication** → **Providers**
   - Find **Google**
   - Make sure it's **enabled** (toggle should be ON)
   - Verify Client ID and Secret are filled in
   - Click **Save** if you made changes

### Step 3: Set Vercel Environment Variables

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Select your project (studyai0)

2. **Add Environment Variables**:
   - Go to: **Settings** → **Environment Variables**
   - Add these variables:

```
Name: VITE_SUPABASE_URL
Value: https://crdqpioymuvnzhtgrenj.supabase.co

Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0

Name: VITE_GOOGLE_CLIENT_ID
Value: 272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com

Name: VITE_GOOGLE_REDIRECT_URI
Value: https://studyai0.vercel.app/auth/google/callback
```

3. **Important**: Select **"Production"** for all variables

4. **Click "Save"**

5. **Redeploy**:
   - Go to **Deployments**
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger deployment

## 🧪 Test Production

After completing all steps:

1. **Go to**: https://studyai0.vercel.app/login
2. **Click**: "Continue with Google"
3. **Sign in** with your Google account
4. **Should redirect** to dashboard ✓

## 🔍 Troubleshooting

### Issue 1: "redirect_uri_mismatch"

**Error in browser**:
```
Error: redirect_uri_mismatch
```

**Fix**:
- Double-check all redirect URIs in Google Console
- Make sure you have BOTH:
  - `https://studyai0.vercel.app/dashboard` (for Supabase Auth)
  - `https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback` (for Supabase)

### Issue 2: "Origin not allowed"

**Error in browser console**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix**:
- Add `https://studyai0.vercel.app` to Authorized JavaScript origins in Google Console
- Add `https://crdqpioymuvnzhtgrenj.supabase.co` as well

### Issue 3: Still redirects to localhost

**Problem**: After Google login, redirects to `http://localhost:5173`

**Fix**:
- Check Vercel environment variables
- Make sure `VITE_GOOGLE_REDIRECT_URI` is set to production URL
- Redeploy after changing environment variables

### Issue 4: "Invalid client"

**Error**:
```
Error: invalid_client
```

**Fix**:
- Verify `VITE_GOOGLE_CLIENT_ID` in Vercel matches Google Console
- Check for typos or extra spaces
- Redeploy after fixing

## 📋 Complete Checklist

Before testing production:

**Google Cloud Console**:
- [ ] Added `https://studyai0.vercel.app` to JavaScript origins
- [ ] Added `https://crdqpioymuvnzhtgrenj.supabase.co` to JavaScript origins
- [ ] Added `https://studyai0.vercel.app/dashboard` to redirect URIs
- [ ] Added `https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback` to redirect URIs
- [ ] Clicked "Save"

**Supabase Dashboard**:
- [ ] Set Site URL to `https://studyai0.vercel.app`
- [ ] Added production redirect URLs
- [ ] Google provider is enabled
- [ ] Client ID and Secret are configured
- [ ] Clicked "Save"

**Vercel Dashboard**:
- [ ] Added `VITE_SUPABASE_URL`
- [ ] Added `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Added `VITE_GOOGLE_CLIENT_ID`
- [ ] Added `VITE_GOOGLE_REDIRECT_URI` (production URL)
- [ ] All variables set to "Production"
- [ ] Redeployed

**Testing**:
- [ ] Cleared browser cache
- [ ] Tested on production URL
- [ ] Google login works
- [ ] Redirects to dashboard
- [ ] User is logged in

## 🎯 Expected Flow (Production)

```
1. User visits: https://studyai0.vercel.app/login
   ↓
2. Clicks "Continue with Google"
   ↓
3. Supabase initiates OAuth with Google
   ↓
4. Google shows account selection
   ↓
5. User selects account
   ↓
6. Google redirects to: https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
   ↓
7. Supabase processes authentication
   ↓
8. Supabase redirects to: https://studyai0.vercel.app/dashboard
   ↓
9. User is logged in! ✓
```

## 🔐 Security Notes

### Environment Variables

**Local (.env)**:
```env
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**Production (Vercel)**:
```env
VITE_GOOGLE_REDIRECT_URI=https://studyai0.vercel.app/auth/google/callback
```

### Why Different Redirect URIs?

- **Supabase Auth**: Uses `https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback`
- **Google Calendar**: Uses `https://studyai0.vercel.app/auth/google/callback`

Both need to be whitelisted in Google Console!

## 🚀 Quick Reference

### Google Console URLs to Add:

**JavaScript Origins**:
```
https://studyai0.vercel.app
https://crdqpioymuvnzhtgrenj.supabase.co
```

**Redirect URIs**:
```
https://studyai0.vercel.app/dashboard
https://studyai0.vercel.app/auth/google/callback
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

### Vercel Environment Variables:

```
VITE_SUPABASE_URL=https://crdqpioymuvnzhtgrenj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your-key]
VITE_GOOGLE_CLIENT_ID=[your-client-id]
VITE_GOOGLE_REDIRECT_URI=https://studyai0.vercel.app/auth/google/callback
```

## 🎉 After Setup

Your Google OAuth will work on:
- ✅ Local development (`http://localhost:5173`)
- ✅ Production (`https://studyai0.vercel.app`)
- ✅ Both login and Google Calendar sync

All set! Test it on production now! 🚀