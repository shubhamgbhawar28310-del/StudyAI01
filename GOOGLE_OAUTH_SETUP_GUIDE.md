# 🔐 Google OAuth Authentication Setup Guide

## ✅ Current Status

Your StudyAI app **already has Google OAuth fully implemented**! Here's what's in place:

### Frontend Implementation ✓
- ✅ **Login Page**: Google sign-in button
- ✅ **Signup Page**: Google sign-up button  
- ✅ **Auth Service**: `signInWithOAuth('google')` function
- ✅ **Environment Variables**: Google Client ID configured
- ✅ **Redirect Handling**: Automatic redirect to dashboard

### What You Need to Do

You just need to **configure Google OAuth in Supabase**. Here's how:

## 🚀 Step-by-Step Setup

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**:
   - Click "Select a project" → "New Project"
   - Name: "StudyAI" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for public app)
   - Fill in:
     - **App name**: StudyAI
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add test users if needed (for testing)
   - Click "Save and Continue"

5. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "StudyAI Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     https://studyai0.vercel.app
     https://crdqpioymuvnzhtgrenj.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5173/auth/callback
     https://studyai0.vercel.app/auth/callback
     https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - **Copy your Client ID and Client Secret** (you'll need these!)

### Step 2: Configure Supabase

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Enable Google Provider**:
   - Go to "Authentication" → "Providers"
   - Find "Google" in the list
   - Toggle it **ON**

3. **Add Google Credentials**:
   - **Client ID**: Paste your Google Client ID
   - **Client Secret**: Paste your Google Client Secret
   - Click "Save"

4. **Configure Redirect URLs** (if not already set):
   - Go to "Authentication" → "URL Configuration"
   - **Site URL**: `https://studyai0.vercel.app`
   - **Redirect URLs**: Add these:
     ```
     http://localhost:5173/dashboard
     https://studyai0.vercel.app/dashboard
     ```

### Step 3: Update Environment Variables (if needed)

Your `.env` file already has the Google Client ID, but make sure it matches:

```env
# Google OAuth (for authentication)
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# Supabase Configuration
VITE_SUPABASE_URL=https://crdqpioymuvnzhtgrenj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Note**: You don't need the Client Secret in your frontend - Supabase handles that!

### Step 4: Test the Integration

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Test Login**:
   - Go to http://localhost:5173/login
   - Click "Continue with Google"
   - Sign in with your Google account
   - Should redirect to dashboard

3. **Test Signup**:
   - Go to http://localhost:5173/signup
   - Click "Continue with Google"
   - Sign in with your Google account
   - Should create account and redirect to dashboard

## 🎯 How It Works

### Authentication Flow

```
User clicks "Continue with Google"
         ↓
signInWithOAuth('google') called
         ↓
Supabase redirects to Google login
         ↓
User signs in with Google
         ↓
Google redirects back to Supabase
         ↓
Supabase creates/updates user
         ↓
Redirects to /dashboard
         ↓
User is logged in! ✓
```

### Code Flow

**Login/Signup Button**:
```tsx
<button onClick={handleGoogleLogin}>
  <img src="google-logo.svg" />
  Continue with Google
</button>
```

**Handler Function**:
```typescript
const handleGoogleLogin = async () => {
  const result = await signInWithOAuth('google');
  if (!result.success) {
    toast({ title: "Login Failed", description: result.error });
  }
  // On success, OAuth redirects automatically
};
```

**Auth Service**:
```typescript
export const signInWithOAuth = async (provider: 'google') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { success: !error, error: error?.message };
};
```

## 🔒 Security Features

Your implementation includes:

✅ **Secure OAuth Flow**: Uses Supabase's built-in OAuth handling
✅ **No Client Secret in Frontend**: Secret stays on Supabase servers
✅ **Automatic Session Management**: Supabase handles tokens
✅ **Error Handling**: User-friendly error messages
✅ **Redirect Protection**: Only redirects to allowed URLs

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch"
**Solution**: Make sure all redirect URIs are added in Google Cloud Console:
- `https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback`
- `http://localhost:5173/auth/callback`
- `https://studyai0.vercel.app/auth/callback`

### Issue: "OAuth consent screen not configured"
**Solution**: Complete the OAuth consent screen setup in Google Cloud Console

### Issue: "Google sign-in popup blocked"
**Solution**: Allow popups for your site in browser settings

### Issue: "User not redirected after login"
**Solution**: Check that redirect URL is set correctly in Supabase:
```typescript
redirectTo: `${window.location.origin}/dashboard`
```

## 📱 User Experience

### What Users See:

**Login Page**:
```
┌─────────────────────────────────────┐
│  Sign in                            │
│  Welcome back! Please sign in       │
│                                     │
│  [🔵 Continue with Google]         │
│                                     │
│  ─── or sign in with email ───     │
│                                     │
│  📧 Email address                   │
│  🔒 Password                        │
│  ☑ Remember me  Forgot password?   │
│                                     │
│  [Sign In]                          │
│                                     │
│  Don't have an account? Sign up    │
└─────────────────────────────────────┘
```

**After Clicking Google Button**:
1. Google login popup appears
2. User selects Google account
3. Grants permissions (first time only)
4. Redirects to dashboard
5. User is logged in!

## 🎨 Customization Options

### Change Button Text:
```tsx
<span>Sign in with Google</span>  // Current
<span>Continue with Google</span> // Alternative
<span>Google Sign In</span>       // Alternative
```

### Add More Providers:
```typescript
// In authService.ts
export const signInWithOAuth = async (
  provider: 'google' | 'github' | 'facebook'
) => {
  // Same implementation works for all providers!
};
```

### Custom Redirect:
```typescript
redirectTo: `${window.location.origin}/onboarding` // Custom page
```

## ✅ Checklist

Before going live, make sure:

- [ ] Google OAuth credentials created
- [ ] OAuth consent screen configured
- [ ] Redirect URIs added to Google Console
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret added to Supabase
- [ ] Tested login flow
- [ ] Tested signup flow
- [ ] Tested on localhost
- [ ] Tested on production domain
- [ ] Privacy Policy link added (required by Google)

## 🚀 Production Deployment

When deploying to production:

1. **Update Google Console**:
   - Add production domain to authorized origins
   - Add production callback URL

2. **Update Supabase**:
   - Add production URL to redirect URLs
   - Update site URL

3. **Update Environment Variables**:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_GOOGLE_CLIENT_ID=your-production-client-id
   ```

4. **Verify Privacy Policy**:
   - Google requires a privacy policy link
   - Add to your OAuth consent screen
   - Link to: https://studyai0.vercel.app/privacy-policy

## 📊 Analytics

Track Google OAuth usage:
```typescript
// In handleGoogleLogin
const result = await signInWithOAuth('google');
if (result.success) {
  // Track successful Google login
  analytics.track('google_login_success');
}
```

Your Google OAuth is ready to use! Just complete the Supabase configuration and you're all set! 🎉