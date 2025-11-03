# 🔄 Update Existing Google Project for OAuth

## ✅ You Can Use Your Existing Google Calendar Project!

No need to create a new project. Just add OAuth authentication to your existing one.

## 🚀 Quick Steps

### 1. Open Your Existing Project
1. Go to: https://console.cloud.google.com/
2. **Select your existing project** (the one with Calendar API)
3. Confirm you see your project name in the top bar

### 2. Edit Your OAuth Client
1. Go to: **APIs & Services** → **Credentials**
2. Find your **OAuth 2.0 Client ID** (you created this for Calendar)
3. Click the **pencil icon** to edit

### 3. Add New Redirect URIs

**IMPORTANT**: Add these WITHOUT removing your existing Calendar redirects!

**Add these new ones**:
```
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
https://studyai0.vercel.app/auth/callback
```

**Keep your existing ones**:
```
http://localhost:5173/auth/google/callback
https://studyai0.vercel.app/auth/google/callback
```

### 4. Your Complete Redirect URI List

After adding, you should have:

```
✅ https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback  ← NEW (Supabase)
✅ http://localhost:5173/auth/callback                        ← NEW (Local Auth)
✅ http://localhost:5173/auth/google/callback                 ← EXISTING (Calendar)
✅ https://studyai0.vercel.app/auth/callback                  ← NEW (Production Auth)
✅ https://studyai0.vercel.app/auth/google/callback           ← EXISTING (Calendar)
```

### 5. Verify Authorized JavaScript Origins

Should have:
```
✅ http://localhost:5173
✅ https://studyai0.vercel.app
✅ https://crdqpioymuvnzhtgrenj.supabase.co
```

### 6. Click "Save"

That's it! Your existing project now supports both:
- ✅ Google Calendar integration
- ✅ Google OAuth authentication

## 🎯 What This Means

### Same Client ID for Both Features!

Your `.env` already has:
```env
VITE_GOOGLE_CLIENT_ID=272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
```

This **same Client ID** now works for:
1. **Google Calendar Sync** - Accessing user's calendar
2. **Google OAuth Login** - Signing in users

### User Experience

When users click "Continue with Google":
1. They see **one OAuth consent screen** (not two separate ones)
2. They grant permissions **once** for both features
3. Permissions include:
   - ✅ Sign in with Google (email, profile)
   - ✅ Access Google Calendar (if they enable sync)

## 📋 Checklist

- [ ] Opened existing Google Cloud project
- [ ] Found existing OAuth 2.0 Client ID
- [ ] Added Supabase redirect URI: `https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback`
- [ ] Added local auth redirect: `http://localhost:5173/auth/callback`
- [ ] Added production auth redirect: `https://studyai0.vercel.app/auth/callback`
- [ ] Kept existing Calendar redirects
- [ ] Verified JavaScript origins
- [ ] Clicked "Save"
- [ ] Copied Client ID and Secret
- [ ] Added to Supabase (next step)

## 🔐 Next Step: Configure Supabase

Now that your Google project is updated:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication** → **Providers**
4. Enable **Google**
5. Paste:
   - **Client ID**: (same one from your .env)
   - **Client Secret**: (from Google Console)
6. Click **Save**

## 🎉 Benefits of Using Same Project

### ✅ Unified Management
- All Google integrations in one place
- Single OAuth consent screen
- Easier to manage and monitor

### ✅ Better User Experience
- Users see one consistent app name
- Single authorization flow
- No confusion about multiple apps

### ✅ Simplified Development
- One set of credentials
- Shared scopes
- Easier debugging

### ✅ Cost Effective
- No need for multiple projects
- Shared quota limits
- Single billing (if applicable)

## 🔍 Visual Guide

### Before (Calendar Only):
```
Google Cloud Project: "StudyAI"
├── OAuth Client ID
│   ├── Redirect URIs:
│   │   ├── http://localhost:5173/auth/google/callback
│   │   └── https://studyai0.vercel.app/auth/google/callback
│   └── Scopes:
│       └── calendar
└── APIs Enabled:
    └── Google Calendar API
```

### After (Calendar + Auth):
```
Google Cloud Project: "StudyAI"
├── OAuth Client ID (SAME ONE!)
│   ├── Redirect URIs:
│   │   ├── https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback  ← NEW
│   │   ├── http://localhost:5173/auth/callback                        ← NEW
│   │   ├── http://localhost:5173/auth/google/callback                 ← EXISTING
│   │   ├── https://studyai0.vercel.app/auth/callback                  ← NEW
│   │   └── https://studyai0.vercel.app/auth/google/callback           ← EXISTING
│   └── Scopes:
│       ├── email, profile, openid  ← NEW
│       └── calendar                ← EXISTING
└── APIs Enabled:
    └── Google Calendar API
```

## 🆘 Troubleshooting

### Issue: "Can't find my OAuth Client ID"
**Solution**: 
- Go to **APIs & Services** → **Credentials**
- Look for "OAuth 2.0 Client IDs" section
- Should see "Web client" or similar name

### Issue: "Redirect URI mismatch" error
**Solution**: 
- Double-check you added the exact URIs listed above
- Make sure there are no typos
- Click "Save" after adding

### Issue: "Client ID doesn't match"
**Solution**: 
- Your `.env` file should have the same Client ID
- Copy it from Google Console if needed
- Restart your dev server after updating `.env`

## ✅ Verification

After setup, test both features:

1. **Test OAuth Login**:
   - Go to http://localhost:5173/login
   - Click "Continue with Google"
   - Should sign in successfully

2. **Test Calendar Sync**:
   - Go to dashboard
   - Enable Google Calendar sync
   - Should connect successfully

Both should work with the **same Google project**! 🎉

## 📚 Related Docs

- `GOOGLE_OAUTH_SETUP_GUIDE.md` - Full OAuth setup guide
- `GOOGLE_OAUTH_QUICK_START.md` - Quick start guide
- `START_HERE_GOOGLE_CALENDAR.md` - Calendar integration guide

Your existing Google project is perfect for both features! 🚀