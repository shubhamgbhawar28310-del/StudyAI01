# 🔧 Fix Google Calendar 400 Error

## 🔍 The Problem

When trying to connect Google Calendar with a different email, you get:
```
400. That's an error.
The server cannot process the request because it is malformed.
```

## 🎯 Root Cause

The **redirect_uri mismatch** between:
1. The initial OAuth request (from frontend)
2. The token exchange request (from Edge Function)

Google requires these to be **EXACTLY the same**.

## ✅ Solution Applied

### 1. Fixed Edge Function

Updated `supabase/functions/google-calendar-auth/index.ts`:
- Changed `Content-Type` to `application/x-www-form-urlencoded` (Google's requirement)
- Added proper URL encoding for parameters
- Added detailed logging for debugging
- Ensured redirect_uri consistency

### 2. What You Need to Do

#### Step 1: Update Supabase Edge Function Secrets

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings** → **Edge Functions** → **Secrets**
4. Add/Update these secrets:

```
GOOGLE_CLIENT_ID=272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**IMPORTANT**: The `GOOGLE_REDIRECT_URI` must match EXACTLY what's in your `.env` file!

#### Step 2: Verify Google Cloud Console Redirect URIs

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Make sure these redirect URIs are added:

```
✅ http://localhost:5173/auth/google/callback
✅ https://studyai0.vercel.app/auth/google/callback
✅ https://crdqpioymuvnzhtgrenj.supabase.co/auth/v1/callback
```

#### Step 3: Deploy Updated Edge Function

```bash
# Deploy the fixed function
supabase functions deploy google-calendar-auth
```

Or if you don't have Supabase CLI, update it in the Supabase dashboard:
1. Go to **Edge Functions**
2. Select `google-calendar-auth`
3. Replace the code with the updated version
4. Click **Deploy**

#### Step 4: Test the Connection

1. Clear your browser cache and cookies
2. Go to your app
3. Try connecting Google Calendar again
4. Should work now! ✓

## 🔍 Debugging

If you still get errors, check the Edge Function logs:

1. Go to Supabase Dashboard
2. **Edge Functions** → `google-calendar-auth` → **Logs**
3. Look for the console.log output showing:
   ```
   Token exchange params: {
     client_id: "...",
     redirect_uri: "...",
     has_code: true,
     has_secret: true
   }
   ```

### Common Issues:

**Issue 1: "redirect_uri_mismatch"**
```
Error: redirect_uri_mismatch
```
**Fix**: Make sure the redirect URI in:
- `.env` file
- Supabase Edge Function secrets
- Google Cloud Console
Are ALL exactly the same (including http/https, trailing slashes, etc.)

**Issue 2: "invalid_client"**
```
Error: invalid_client
```
**Fix**: 
- Check that Client ID and Secret are correct in Supabase secrets
- Make sure they match your Google Cloud Console credentials

**Issue 3: "invalid_grant"**
```
Error: invalid_grant
```
**Fix**:
- The authorization code has expired (only valid for ~10 minutes)
- Try the OAuth flow again
- Make sure redirect_uri matches exactly

## 📋 Checklist

Before testing:
- [ ] Updated Edge Function code
- [ ] Added GOOGLE_CLIENT_ID to Supabase secrets
- [ ] Added GOOGLE_CLIENT_SECRET to Supabase secrets
- [ ] Added GOOGLE_REDIRECT_URI to Supabase secrets
- [ ] Verified redirect URIs in Google Console
- [ ] Deployed Edge Function
- [ ] Cleared browser cache
- [ ] Tested with different email

## 🎯 Expected Flow

### Correct OAuth Flow:

```
1. User clicks "Connect Google Calendar"
   ↓
2. Frontend initiates OAuth with redirect_uri:
   http://localhost:5173/auth/google/callback
   ↓
3. User authorizes on Google
   ↓
4. Google redirects back with code:
   http://localhost:5173/auth/google/callback?code=...
   ↓
5. Frontend sends code to Edge Function
   ↓
6. Edge Function exchanges code with SAME redirect_uri:
   http://localhost:5173/auth/google/callback
   ↓
7. Google returns access token ✓
   ↓
8. Edge Function stores tokens in database ✓
   ↓
9. User is connected! 🎉
```

## 🔐 Security Notes

### Why Use Edge Function?

The Edge Function is necessary because:
1. **Client Secret Protection**: Never expose Client Secret in frontend
2. **Secure Token Storage**: Tokens stored server-side in database
3. **Token Refresh**: Server can refresh expired tokens automatically

### Environment Variables

**Frontend (.env)**:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**Edge Function (Supabase Secrets)**:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret  ← Never in frontend!
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

## 🚀 Production Deployment

For production, update:

**Frontend .env.production**:
```env
VITE_GOOGLE_REDIRECT_URI=https://studyai0.vercel.app/auth/google/callback
```

**Supabase Edge Function Secrets**:
```
GOOGLE_REDIRECT_URI=https://studyai0.vercel.app/auth/google/callback
```

**Google Cloud Console**:
- Add production redirect URI
- Update authorized origins

## 📊 Testing Different Emails

To test with different Google accounts:

1. **Clear browser data** for your app
2. **Use incognito mode** (recommended)
3. Or **sign out** of all Google accounts first
4. Try connecting with different email
5. Should work without 400 error ✓

## 🆘 Still Having Issues?

If you still get 400 errors:

1. **Check Edge Function logs** in Supabase dashboard
2. **Verify all redirect URIs match exactly**
3. **Try in incognito mode** to rule out cache issues
4. **Check Google Cloud Console** for any error messages
5. **Ensure OAuth consent screen is published** (not in testing mode)

The fix is deployed and ready to test! 🎉