# 🔧 Fix: Edge Function Error - Google Calendar

## 🔍 The Error

```
Connection Failed
Edge Function returned a non-2xx status code
Redirecting...
```

This happens when trying to connect Google Calendar after granting access.

## 🎯 Root Cause

The `google-calendar-auth` Edge Function is missing required secrets:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## ✅ Complete Fix

### Step 1: Get Your Google Client Secret

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Get Client Secret**:
   - Go to: **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID**
   - You'll see:
     - **Client ID**: `272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com`
     - **Client Secret**: Click "Show" to reveal it
   - **Copy both** (you'll need them in Step 2)

### Step 2: Add Secrets to Supabase Edge Functions

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**:
   - Click **Edge Functions** in the left sidebar
   - Click **"Manage secrets"** or **"Secrets"** button

3. **Add These 3 Secrets**:

Click **"Add secret"** for each:

**Secret 1**:
```
Name: GOOGLE_CLIENT_ID
Value: 272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
```

**Secret 2**:
```
Name: GOOGLE_CLIENT_SECRET
Value: [paste your client secret from Step 1]
```

**Secret 3**:
```
Name: GOOGLE_REDIRECT_URI
Value: http://localhost:5173/auth/google/callback
```

4. **Click "Save" or "Add"** for each secret

### Step 3: Add Supabase Service Role Key

The Edge Function also needs access to your database:

1. **Get Service Role Key**:
   - In Supabase Dashboard
   - Go to: **Settings** → **API**
   - Find **"service_role"** key (NOT the anon key!)
   - Click "Reveal" and copy it

2. **Add as Secret**:
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [paste your service_role key]
```

3. **Add Supabase URL**:
```
Name: SUPABASE_URL
Value: https://crdqpioymuvnzhtgrenj.supabase.co
```

### Step 4: Deploy/Restart Edge Function

After adding secrets:

**Option A - Automatic**:
- Secrets are automatically available to deployed functions
- Just wait 30 seconds

**Option B - Redeploy** (if needed):
1. Go to **Edge Functions**
2. Find `google-calendar-auth`
3. Click **"Deploy"** or **"Redeploy"**

### Step 5: Test Google Calendar Connection

1. **Clear browser cache** (or use incognito)
2. Go to your app
3. Try connecting Google Calendar again
4. Should work now! ✓

## 📋 Complete Secrets Checklist

Your Edge Function needs these 5 secrets:

- [ ] `GOOGLE_CLIENT_ID` - Your OAuth Client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Your OAuth Client Secret
- [ ] `GOOGLE_REDIRECT_URI` - Callback URL
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for database access)

## 🔍 How to Verify Secrets Are Set

1. Go to Supabase Dashboard
2. **Edge Functions** → **Secrets**
3. You should see all 5 secrets listed
4. Values should be hidden (for security)

## 🐛 Debugging

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. **Edge Functions** → `google-calendar-auth`
3. Click **"Logs"** or **"Invocations"**
4. Look for error messages

Common errors you might see:

**Error: "Missing code or userId"**
- The frontend isn't sending the authorization code
- Check browser console for errors

**Error: "Token exchange failed"**
- Client ID or Secret is wrong
- Check secrets match Google Console

**Error: "Cannot find module"**
- Edge Function code issue
- Redeploy the function

### Test Edge Function Directly

You can test if secrets are working:

1. Go to **Edge Functions** → `google-calendar-auth`
2. Click **"Test"** or **"Invoke"**
3. Send test payload:
```json
{
  "code": "test",
  "userId": "test"
}
```
4. Should see error about invalid code (that's OK - means secrets are loaded!)

## 🎯 Expected Flow

After fixing:

```
1. User clicks "Connect Google Calendar"
   ↓
2. Google OAuth popup opens
   ↓
3. User grants calendar access
   ↓
4. Google redirects with authorization code
   ↓
5. Frontend calls Edge Function with code
   ↓
6. Edge Function exchanges code for tokens ✓
   (uses GOOGLE_CLIENT_SECRET)
   ↓
7. Edge Function stores tokens in database ✓
   (uses SUPABASE_SERVICE_ROLE_KEY)
   ↓
8. Success! Calendar connected ✓
```

## 🔐 Security Notes

### Why Use Edge Function?

- **Protects Client Secret**: Never exposed to frontend
- **Secure Token Storage**: Tokens stored server-side
- **Service Role Access**: Can write to database securely

### Secret Types

**Frontend (.env)** - Public:
```env
VITE_GOOGLE_CLIENT_ID=...  ← OK to expose
```

**Edge Function (Supabase Secrets)** - Private:
```
GOOGLE_CLIENT_SECRET=...        ← NEVER expose!
SUPABASE_SERVICE_ROLE_KEY=...   ← NEVER expose!
```

## 🚀 Production Setup

For production, add production redirect URI:

```
Name: GOOGLE_REDIRECT_URI
Value: https://studyai0.vercel.app/auth/google/callback
```

Or use environment-based secrets if Supabase supports it.

## 📊 Quick Reference

### Where to Find Each Secret:

| Secret | Where to Find |
|--------|---------------|
| `GOOGLE_CLIENT_ID` | Google Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Console → Credentials → Show |
| `GOOGLE_REDIRECT_URI` | Your app URL + `/auth/google/callback` |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

### Where to Add Secrets:

Supabase Dashboard → Edge Functions → Manage Secrets

## ✅ After Setup

Your Google Calendar integration will:
- ✅ Connect successfully
- ✅ Store tokens securely
- ✅ Sync events automatically
- ✅ Work for all users

The Edge Function error should be gone! 🎉

## 🆘 Still Having Issues?

1. **Check all 5 secrets are added**
2. **Verify Client Secret is correct** (copy-paste from Google Console)
3. **Check Edge Function logs** for specific errors
4. **Try in incognito mode** to rule out cache issues
5. **Redeploy Edge Function** if secrets were just added

Need more help? Check the Edge Function logs for the exact error message!