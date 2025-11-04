# 🔧 Fix: Google OAuth Redirects to Port 3000

## 🔍 The Problem

After Google login, you're redirected to:
```
http://localhost:3000/#access_token=...
```

But your app runs on:
```
http://localhost:5173
```

**Why?** Supabase has the wrong redirect URL configured.

## ✅ Quick Fix (2 Steps)

### Step 1: Update Supabase Site URL

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Update Site URL**:
   - Go to: **Authentication** → **URL Configuration**
   - Find **"Site URL"**
   - Change from: `http://localhost:3000`
   - Change to: `http://localhost:5173`
   - Click **Save**

3. **Update Redirect URLs**:
   - In the same section, find **"Redirect URLs"**
   - Make sure you have:
   ```
   http://localhost:5173/**
   http://localhost:5173/dashboard
   https://studyai0.vercel.app/**
   https://studyai0.vercel.app/dashboard
   ```
   - Click **Save**

### Step 2: Update Google Cloud Console (if needed)

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Check Redirect URIs**:
   - Go to: **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Make sure you have:
   ```
   http://localhost:5173/dashboard
   https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
   ```
   - **Remove** `http://localhost:3000` if it's there
   - Click **Save**

## 🧪 Test It

1. Clear browser cache (or use incognito)
2. Go to: http://localhost:5173/login
3. Click "Continue with Google"
4. Should redirect to: http://localhost:5173/dashboard ✓

## 🎯 What Was Wrong?

The OAuth flow was:
```
1. User clicks "Continue with Google"
   ↓
2. Google authenticates user ✓
   ↓
3. Supabase processes authentication ✓
   ↓
4. Supabase redirects to Site URL ❌
   (was: http://localhost:3000)
   (should be: http://localhost:5173)
```

## 📋 Correct Configuration

### Supabase Settings:

**Site URL**:
```
http://localhost:5173  ← For local development
```

**Redirect URLs**:
```
http://localhost:5173/**
http://localhost:5173/dashboard
https://studyai0.vercel.app/**
https://studyai0.vercel.app/dashboard
```

### Google Console:

**Authorized JavaScript origins**:
```
http://localhost:5173
https://studyai0.vercel.app
https://crdqpioymuvnzhtgrenj.supabase.co
```

**Authorized redirect URIs**:
```
http://localhost:5173/dashboard
https://studyai0.vercel.app/dashboard
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

## 🔍 Why Port 3000?

Port 3000 is the default for:
- Create React App
- Next.js
- Many other frameworks

But Vite (which you're using) defaults to port 5173.

## ✅ Verification

After fixing, the URL should be:
```
http://localhost:5173/#access_token=...
                  ↑
                5173 (correct!)
```

Not:
```
http://localhost:3000/#access_token=...
                  ↑
                3000 (wrong!)
```

## 🚀 For Production

Make sure Supabase Site URL is also correct for production:

**Site URL**: `https://studyai0.vercel.app`

This ensures production redirects work correctly too!

## 🎉 After Fix

Your Google OAuth will:
- ✅ Authenticate successfully
- ✅ Redirect to correct port (5173)
- ✅ Load your dashboard
- ✅ User is logged in

That's it! Just update the Site URL in Supabase! 🚀