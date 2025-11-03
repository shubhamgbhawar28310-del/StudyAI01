# 🚀 Google OAuth Quick Start

## ✅ Good News!

Your app **already has Google OAuth fully implemented**! You just need to configure it in Supabase.

## 🎯 3-Minute Setup

### 1. Get Google Credentials (2 minutes)

1. Go to: https://console.cloud.google.com/
2. Create new project: "StudyAI"
3. Go to: **APIs & Services** → **Credentials**
4. Click: **Create Credentials** → **OAuth client ID**
5. Add these redirect URIs:
   ```
   https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   ```
6. Copy your **Client ID** and **Client Secret**

### 2. Configure Supabase (1 minute)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication** → **Providers**
4. Enable **Google**
5. Paste:
   - **Client ID**: (from step 1)
   - **Client Secret**: (from step 1)
6. Click **Save**

### 3. Test It!

1. Go to: http://localhost:5173/login
2. Click: **Continue with Google**
3. Sign in with Google
4. You're in! 🎉

## 📸 What Users Will See

### Login Page
```
┌──────────────────────────────────────┐
│                                      │
│         Sign in                      │
│   Welcome back! Please sign in       │
│                                      │
│   ┌────────────────────────────┐    │
│   │ 🔵 Continue with Google    │    │
│   └────────────────────────────┘    │
│                                      │
│   ─── or sign in with email ───     │
│                                      │
│   📧 Email address                   │
│   🔒 Password                        │
│                                      │
│   [Sign In]                          │
│                                      │
└──────────────────────────────────────┘
```

### Google Popup
```
┌──────────────────────────────────────┐
│  Choose an account                   │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 👤 john@gmail.com              │ │
│  │    John Doe                    │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 👤 jane@gmail.com              │ │
│  │    Jane Smith                  │ │
│  └────────────────────────────────┘ │
│                                      │
│  [Use another account]               │
└──────────────────────────────────────┘
```

### After Login
```
✅ Redirects to: /dashboard
✅ User is logged in
✅ Session is active
```

## 🔧 Current Implementation

Your code already has:

**Login Button** (`src/pages/Login.tsx`):
```tsx
<button onClick={handleGoogleLogin}>
  <img src="google-logo.svg" />
  Continue with Google
</button>
```

**Signup Button** (`src/pages/Signup.tsx`):
```tsx
<button onClick={handleGoogleSignup}>
  <img src="google-logo.svg" />
  Continue with Google
</button>
```

**Auth Service** (`src/services/authService.ts`):
```typescript
export const signInWithOAuth = async (provider: 'google') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { success: !error };
};
```

## ⚡ That's It!

No code changes needed. Just:
1. Get Google credentials
2. Add to Supabase
3. Test

Your Google OAuth is ready! 🚀

## 🆘 Need Help?

**Issue**: "Redirect URI mismatch"
**Fix**: Add this to Google Console:
```
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

**Issue**: "OAuth not configured"
**Fix**: Enable Google provider in Supabase Authentication settings

**Issue**: "Popup blocked"
**Fix**: Allow popups for your site in browser settings

## 📚 Full Guide

For detailed instructions, see: `GOOGLE_OAUTH_SETUP_GUIDE.md`