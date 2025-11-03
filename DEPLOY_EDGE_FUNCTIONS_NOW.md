# 🚀 Deploy Edge Functions - Required!

## The Problem

You're getting these errors:
```
Failed to load resource: net::ERR_FAILED
google-calendar-batch-sync
CORS policy error
```

This means the **Edge Functions aren't deployed yet**. The OAuth flow works, but the backend functions that handle the tokens don't exist.

---

## ✅ Solution: Deploy Edge Functions via Dashboard

Since the CLI didn't work, let's use the Supabase Dashboard.

### Step 1: Go to Edge Functions

1. Go to: https://app.supabase.com/
2. Select your project
3. Click **Edge Functions** in the left sidebar

### Step 2: Deploy Function 1 - google-calendar-auth

1. Click **"Create a new function"** or **"Deploy new function"**
2. **Function name**: `google-calendar-auth`
3. **Copy the code** from the file below
4. **Paste** into the editor
5. Click **"Deploy"**

**Code to copy** (from `supabase/functions/google-calendar-auth/index.ts`):

```typescript
// Google Calendar OAuth Token Exchange
// Securely exchanges authorization code for access tokens

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      throw new Error('Missing code or userId');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI'),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('user_settings')
      .update({
        google_calendar_connected: true,
        google_calendar_email: userInfo.email,
        google_calendar_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expires_at: expiresAt.toISOString(),
        google_calendar_last_sync: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: userInfo.email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in google-calendar-auth:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

### Step 3: Deploy Function 2 - google-calendar-sync

1. Click **"Create a new function"** again
2. **Function name**: `google-calendar-sync`
3. **Copy and paste** the code from `supabase/functions/google-calendar-sync/index.ts`
4. Click **"Deploy"**

### Step 4: Deploy Function 3 - google-calendar-worker

1. Click **"Create a new function"** again
2. **Function name**: `google-calendar-worker`
3. **Copy and paste** the code from `supabase/functions/google-calendar-worker/index.ts`
4. Click **"Deploy"**

---

## Step 5: Set Secrets

After deploying functions, set the secrets:

1. Go to **Project Settings** → **Edge Functions**
2. Scroll to **Secrets** section
3. Add these secrets:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | Your Google Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5173/auth/google/callback` |

---

## Step 6: Test Again

1. Go back to your app
2. Go to Settings → Notifications
3. Click "Connect Calendar"
4. Sign in with Google
5. Should work now! ✅

---

## 🎯 Quick Checklist

- [ ] Deploy `google-calendar-auth` function
- [ ] Deploy `google-calendar-sync` function
- [ ] Deploy `google-calendar-worker` function
- [ ] Set `GOOGLE_CLIENT_ID` secret
- [ ] Set `GOOGLE_CLIENT_SECRET` secret
- [ ] Set `GOOGLE_REDIRECT_URI` secret
- [ ] Test OAuth connection

---

## 📁 Where to Find the Code

All three function codes are in:
- `supabase/functions/google-calendar-auth/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-calendar-worker/index.ts`

Just open these files, copy the code, and paste into Supabase Dashboard.

---

## ⚠️ Important Notes

### About google-calendar-batch-sync

The error mentions `google-calendar-batch-sync` but we don't have that function. This is called from the frontend but it's optional. The main functions you need are:
1. `google-calendar-auth` - **Required** for OAuth
2. `google-calendar-sync` - **Required** for syncing
3. `google-calendar-worker` - **Required** for background processing

### Remove the batch-sync call

Let me update the frontend to remove the batch-sync call since we're using the worker instead.

---

## 🐛 Troubleshooting

### "Function not found"
**Solution**: Make sure function names match exactly (no typos)

### "CORS error"
**Solution**: Functions include CORS headers, should work after deployment

### "Secrets not found"
**Solution**: Set all 3 secrets in Project Settings → Edge Functions → Secrets

### Still not working?
**Check**:
1. All 3 functions deployed
2. All 3 secrets set
3. Function logs for errors (Edge Functions → select function → Logs)

---

**Deploy the 3 Edge Functions now and it will work! 🚀**
