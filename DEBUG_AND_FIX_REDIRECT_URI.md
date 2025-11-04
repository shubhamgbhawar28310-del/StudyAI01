# 🔍 Debug and Fix redirect_uri_mismatch

## 🎯 Current Status

Still getting `redirect_uri_mismatch` error. Let's debug and fix it properly.

## ✅ Step-by-Step Fix

### Step 1: Check What Frontend Is Using

1. **Open your app** in browser
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Try connecting Google Calendar**
5. **Look for this log**:
   ```
   🚀 Initiating Google Calendar OAuth: {
     client_id: "...",
     redirect_uri: "...",  ← THIS IS IMPORTANT!
   }
   ```
6. **Copy the exact redirect_uri value**

### Step 2: Check What Edge Function Is Using

1. **Go to Supabase Dashboard**
2. **Edge Functions** → `google-calendar-auth` → **Logs**
3. **Look for this log**:
   ```
   🔍 Token exchange attempt: {
     redirect_uri: "...",  ← THIS IS IMPORTANT!
   }
   ```
4. **Copy the exact redirect_uri value**

### Step 3: Compare the Two Values

The values from Step 1 and Step 2 **MUST BE EXACTLY THE SAME**.

**Common mismatches**:
```
Frontend:  http://localhost:5173/auth/google/callback
Edge Func: http://localhost:5173/auth/google/callback/  ← Extra slash!

Frontend:  http://localhost:5173/auth/google/callback
Edge Func: https://localhost:5173/auth/google/callback  ← HTTPS vs HTTP!

Frontend:  http://localhost:5173/auth/google/callback
Edge Func: http://localhost:3000/auth/google/callback  ← Wrong port!
```

### Step 4: Fix the Mismatch

**If Edge Function has wrong value**:

1. Go to Supabase Dashboard
2. **Edge Functions** → **Manage Secrets**
3. Find `GOOGLE_REDIRECT_URI`
4. Update to EXACT value from Step 1
5. Click **Save**
6. Wait 30 seconds

**If Frontend has wrong value**:

1. Check your `.env` file
2. Update `VITE_GOOGLE_REDIRECT_URI` to correct value
3. Restart dev server: `npm run dev`

### Step 5: Verify Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. Click your OAuth Client ID
4. Check **Authorized redirect URIs**
5. Make sure it has the EXACT value from Step 1
6. If not, add it and click **Save**

### Step 6: Test Again

1. Clear browser cache
2. Try Google Calendar connection
3. Check logs again
4. Should work now! ✓

## 🔍 Detailed Debugging

### Check All Environment Variables

**Frontend (.env)**:
```bash
# Check your .env file
cat .env | grep GOOGLE
```

Should show:
```
VITE_GOOGLE_CLIENT_ID=272083546413-srodngru0snifufgrod1mepmkv9ns8d2.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**Supabase Secrets**:
1. Go to Supabase Dashboard
2. **Edge Functions** → **Manage Secrets**
3. Check these exist:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`

### Check Google Console Configuration

1. Go to Google Cloud Console
2. **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. **Authorized redirect URIs** should have:
   ```
   http://localhost:5173/auth/google/callback
   https://studyai0.vercel.app/auth/google/callback
   ```

## 🎯 The Three Must Match

```
┌─────────────────────────────────────────────────┐
│ Frontend (.env)                                 │
│ VITE_GOOGLE_REDIRECT_URI=                      │
│ http://localhost:5173/auth/google/callback     │
└─────────────────────────────────────────────────┘
                    ↓ MUST MATCH ↓
┌─────────────────────────────────────────────────┐
│ Supabase Edge Function Secret                  │
│ GOOGLE_REDIRECT_URI=                           │
│ http://localhost:5173/auth/google/callback     │
└─────────────────────────────────────────────────┘
                    ↓ MUST MATCH ↓
┌─────────────────────────────────────────────────┐
│ Google Cloud Console                            │
│ Authorized redirect URIs:                      │
│ http://localhost:5173/auth/google/callback     │
└─────────────────────────────────────────────────┘
```

## 🔧 Common Issues and Fixes

### Issue 1: Extra Whitespace

**Problem**: Secret has extra spaces
```
"http://localhost:5173/auth/google/callback "  ← Space at end!
```

**Fix**: 
- Delete and re-add the secret
- Copy-paste carefully without extra spaces

### Issue 2: Wrong Protocol

**Problem**: HTTP vs HTTPS mismatch
```
Frontend: http://localhost:5173/...
Secret:   https://localhost:5173/...  ← Wrong!
```

**Fix**: Use `http://` for localhost (not https)

### Issue 3: Trailing Slash

**Problem**: One has trailing slash, other doesn't
```
Frontend: http://localhost:5173/auth/google/callback
Secret:   http://localhost:5173/auth/google/callback/  ← Extra slash!
```

**Fix**: Remove trailing slash from all places

### Issue 4: Port Number

**Problem**: Different ports
```
Frontend: http://localhost:5173/...
Secret:   http://localhost:3000/...  ← Wrong port!
```

**Fix**: Use port 5173 (Vite's default)

### Issue 5: Secret Not Updated

**Problem**: Changed secret but still using old value

**Fix**:
- Wait 30-60 seconds after updating secret
- Or redeploy Edge Function
- Or restart Supabase project (extreme)

## 📊 Verification Checklist

Run through this checklist:

- [ ] Checked frontend console log for redirect_uri
- [ ] Checked Edge Function logs for redirect_uri
- [ ] Both values are EXACTLY the same
- [ ] No extra spaces or characters
- [ ] No trailing slashes
- [ ] Correct protocol (http for localhost)
- [ ] Correct port (5173)
- [ ] Google Console has the same URI
- [ ] Waited 30 seconds after updating secrets
- [ ] Restarted dev server
- [ ] Cleared browser cache
- [ ] Tested in incognito mode

## 🚀 After Debugging

Once you identify the mismatch:

1. **Update the wrong value** to match the others
2. **Wait 30 seconds** for changes to propagate
3. **Clear cache** and test again
4. **Check logs** to verify values now match

## 💡 Pro Tip

To avoid this issue in the future:

1. **Define redirect URI once** in `.env`
2. **Copy exact value** to Supabase secrets
3. **Copy exact value** to Google Console
4. **Never type it manually** - always copy-paste

## 🎉 Success Indicators

When it's working, you'll see:
- ✅ No `redirect_uri_mismatch` error
- ✅ Token exchange succeeds
- ✅ Tokens stored in database
- ✅ "Connected successfully" message

The key is making sure all three places have the EXACT same value! 🎯