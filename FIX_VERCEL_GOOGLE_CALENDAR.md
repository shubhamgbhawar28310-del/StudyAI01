# 🚀 Fix Google Calendar on Vercel Production

## 🎯 The Issue

Google Calendar works on **localhost** but fails on **Vercel** (studyai0.vercel.app) with `redirect_uri_mismatch`.

## ✅ Complete Fix for Production

### Step 1: Add Production Redirect URI to Google Console

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project

2. **Edit OAuth Client**:
   - Click your OAuth 2.0 Client ID

3. **Add Production Redirect URI**:
   - Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
   - Add: `https://studyai0.vercel.app/auth/google/callback`
   - Click **"SAVE"**

4. **Your Complete Redirect URIs Should Be**:
   ```
   http://localhost:5173/auth/google/callback          ← Local
   https://studyai0.vercel.app/auth/google/callback   ← Production
   ```

### Step 2: Add Production Redirect URI to Supabase Secret

**Option A: Use Environment-Based Logic** (Recommended)

Update your Edge Function to detect environment:

```typescript
// In google-calendar-auth/index.ts
const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
const redirectUri = isProduction 
  ? 'https://studyai0.vercel.app/auth/google/callback'
  : Deno.env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:5173/auth/google/callback';
```

**Option B: Add Both URIs to Secret** (Simpler)

1. Go to Supabase Dashboard → Edge Functions → Manage Secrets
2. Update `GOOGLE_REDIRECT_URI` to include both:
   - For now, just use the production one since you're testing production
   - Value: `https://studyai0.vercel.app/auth/google/callback`

**Option C: Add Separate Secret** (Best for long-term)

1. Add new secret: `GOOGLE_REDIRECT_URI_PRODUCTION`
2. Value: `https://studyai0.vercel.app/auth/google/callback`
3. Update Edge Function to use it based on request origin

### Step 3: Update Vercel Environment Variables

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Update Environment Variable**:
   - Go to: **Settings** → **Environment Variables**
   - Find or add: `VITE_GOOGLE_REDIRECT_URI`
   - Value: `https://studyai0.vercel.app/auth/google/callback`
   - Environment: **Production**
   - Click **Save**

3. **Redeploy**:
   - Go to **Deployments**
   - Click **"Redeploy"** on latest deployment

### Step 4: Update Edge Function to Handle Both Environments

The best approach is to make the Edge Function smart about which redirect URI to use:

```typescript
// Get redirect URI from request or environment
const getRedirectUri = (req: Request) => {
  const origin = new URL(req.url).origin;
  
  // If request is from production
  if (origin.includes('vercel.app') || origin.includes('studyai0')) {
    return 'https://studyai0.vercel.app/auth/google/callback';
  }
  
  // Default to localhost
  return 'http://localhost:5173/auth/google/callback';
};

// In your token exchange code:
const redirectUri = getRedirectUri(req);
```

Or simpler - just check the environment:

```typescript
// Detect environment from Supabase URL or custom env var
const isProduction = Deno.env.get('SUPABASE_URL')?.includes('crdqpioymuvnzhtgrenj');
const redirectUri = isProduction
  ? 'https://studyai0.vercel.app/auth/google/callback'
  : 'http://localhost:5173/auth/google/callback';
```

## 🔧 Quick Fix (Right Now)

Since you're testing on Vercel, do this immediately:

1. **Google Console**:
   - Add: `https://studyai0.vercel.app/auth/google/callback`

2. **Supabase Secret**:
   - Change `GOOGLE_REDIRECT_URI` to: `https://studyai0.vercel.app/auth/google/callback`
   - (This will break localhost temporarily, but fixes production)

3. **Test on Vercel**:
   - Should work now! ✓

4. **To fix localhost again**:
   - Change secret back to: `http://localhost:5173/auth/google/callback`

## 🎯 Permanent Solution

Update your Edge Function to auto-detect:

```typescript
// supabase/functions/google-calendar-auth/index.ts

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    // Auto-detect redirect URI based on environment
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI_PRODUCTION')
      ? Deno.env.get('GOOGLE_REDIRECT_URI_PRODUCTION')
      : Deno.env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:5173/auth/google/callback';

    console.log('🔍 Using redirect_uri:', redirectUri);

    // Rest of your code...
  }
});
```

Then add both secrets:
- `GOOGLE_REDIRECT_URI` = `http://localhost:5173/auth/google/callback`
- `GOOGLE_REDIRECT_URI_PRODUCTION` = `https://studyai0.vercel.app/auth/google/callback`

## 📋 Complete Configuration

### Google Cloud Console:

**Authorized JavaScript origins**:
```
http://localhost:5173
https://studyai0.vercel.app
https://crdqpioymuvnzhtgrenj.supabase.co
```

**Authorized redirect URIs**:
```
http://localhost:5173/auth/google/callback
https://studyai0.vercel.app/auth/google/callback
https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

### Supabase Secrets:

```
GOOGLE_CLIENT_ID = 272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = [your-secret]
GOOGLE_REDIRECT_URI = http://localhost:5173/auth/google/callback
GOOGLE_REDIRECT_URI_PRODUCTION = https://studyai0.vercel.app/auth/google/callback
SUPABASE_URL = https://crdqpioymuvnzhtgrenj.supabase.co
SUPABASE_SERVICE_ROLE_KEY = [your-key]
```

### Vercel Environment Variables:

```
VITE_GOOGLE_CLIENT_ID = 272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI = https://studyai0.vercel.app/auth/google/callback
VITE_SUPABASE_URL = https://crdqpioymuvnzhtgrenj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = [your-key]
```

## 🧪 Testing

**Test Localhost**:
1. Use `GOOGLE_REDIRECT_URI` secret
2. Should work with `http://localhost:5173/auth/google/callback`

**Test Production**:
1. Use `GOOGLE_REDIRECT_URI_PRODUCTION` secret (or update main secret)
2. Should work with `https://studyai0.vercel.app/auth/google/callback`

## 🎉 After Fix

Both environments will work:
- ✅ Localhost: `http://localhost:5173/auth/google/callback`
- ✅ Production: `https://studyai0.vercel.app/auth/google/callback`

The key is having both redirect URIs in Google Console and handling them properly in your Edge Function! 🚀