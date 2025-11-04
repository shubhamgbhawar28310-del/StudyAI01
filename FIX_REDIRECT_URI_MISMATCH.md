# 🔧 Fix: redirect_uri_mismatch Error

## 🔍 The Error

```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "Bad Request"
}
```

## 🎯 Root Cause

The `redirect_uri` in your Edge Function secret doesn't match:
1. What was used in the initial OAuth request
2. What's configured in Google Cloud Console

## ✅ Complete Fix

### Step 1: Check Your .env File

Look at your `.env` file:
```env
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

This is what the frontend uses for the initial OAuth request.

### Step 2: Update Supabase Edge Function Secret

The Edge Function secret MUST match your `.env` file EXACTLY.

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Your project → **Edge Functions** → **Manage Secrets**

2. **Update GOOGLE_REDIRECT_URI**:
   - Find: `GOOGLE_REDIRECT_URI`
   - Click **Edit** or **Delete** and re-add
   - Set value to: `http://localhost:5173/auth/google/callback`
   - Click **Save**

### Step 3: Verify Google Cloud Console

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Your project → **APIs & Services** → **Credentials**

2. **Check Redirect URIs**:
   - Click your OAuth 2.0 Client ID
   - Make sure you have EXACTLY:
   ```
   http://localhost:5173/auth/google/callback
   ```
   - **Important**: No trailing slash, exact match!

3. **Click Save** if you made changes

### Step 4: Test Again

1. Clear browser cache (or use incognito)
2. Try connecting Google Calendar
3. Should work now! ✓

## 📋 The Redirect URI Must Match EVERYWHERE

All three places must have the EXACT same value:

**1. Frontend (.env)**:
```env
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**2. Supabase Edge Function Secret**:
```
Name: GOOGLE_REDIRECT_URI
Value: http://localhost:5173/auth/google/callback
```

**3. Google Cloud Console**:
```
Authorized redirect URIs:
http://localhost:5173/auth/google/callback
```

## 🔍 Common Mistakes

### ❌ Wrong:
```
http://localhost:5173/auth/google/callback/   ← Trailing slash
http://localhost:5173/auth/google/callback?   ← Query string
https://localhost:5173/auth/google/callback   ← HTTPS (should be HTTP for local)
http://localhost:3000/auth/google/callback    ← Wrong port
```

### ✅ Correct:
```
http://localhost:5173/auth/google/callback
```

## 🎯 How OAuth Flow Works

```
1. Frontend initiates OAuth with redirect_uri:
   http://localhost:5173/auth/google/callback
   ↓
2. User authorizes on Google
   ↓
3. Google redirects back with code:
   http://localhost:5173/auth/google/callback?code=...
   ↓
4. Frontend sends code to Edge Function
   ↓
5. Edge Function exchanges code with SAME redirect_uri:
   http://localhost:5173/auth/google/callback  ← MUST MATCH!
   ↓
6. Google verifies redirect_uri matches
   ↓
7. If match: Returns tokens ✓
   If mismatch: Returns 400 error ❌
```

## 🚀 For Production

When deploying to production, you'll need to:

**1. Update .env.production**:
```env
VITE_GOOGLE_REDIRECT_URI=https://studyai0.vercel.app/auth/google/callback
```

**2. Update Supabase Secret** (or add production-specific):
```
GOOGLE_REDIRECT_URI=https://studyai0.vercel.app/auth/google/callback
```

**3. Add to Google Console**:
```
https://studyai0.vercel.app/auth/google/callback
```

## 🔍 Debugging

### Check What Redirect URI Is Being Used

Add this to your Edge Function (temporarily):

```typescript
console.log('Redirect URI being used:', redirectUri);
console.log('From env:', Deno.env.get('GOOGLE_REDIRECT_URI'));
```

Then check the logs to see what value is actually being sent.

### Verify in Browser Network Tab

1. Open browser DevTools → Network tab
2. Try connecting Google Calendar
3. Look for the request to Google OAuth
4. Check the `redirect_uri` parameter in the URL
5. This is what the Edge Function must use

## ✅ Quick Verification

Run this checklist:

- [ ] `.env` has: `VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback`
- [ ] Supabase secret has: `GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback`
- [ ] Google Console has: `http://localhost:5173/auth/google/callback` in redirect URIs
- [ ] All three are EXACTLY the same (no extra spaces, slashes, etc.)
- [ ] Restarted dev server after changing .env
- [ ] Waited 30 seconds after updating Supabase secret

## 🎉 After Fix

Your Google Calendar connection will:
- ✅ Complete OAuth flow successfully
- ✅ Exchange code for tokens
- ✅ Store tokens in database
- ✅ Enable calendar sync

The redirect_uri_mismatch error should be gone! 🚀

## 🆘 Still Not Working?

1. **Double-check all three locations** have exact same URI
2. **Look for typos** (common: `/callback` vs `/callbacks`)
3. **Check for trailing slashes** (shouldn't have any)
4. **Verify port number** (5173 for Vite, not 3000)
5. **Try in incognito mode** to rule out cache issues
6. **Check Edge Function logs** for the actual redirect_uri being used

The key is: ALL THREE MUST MATCH EXACTLY! 🎯