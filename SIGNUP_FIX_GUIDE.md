# 🔧 Signup "Failed to Fetch" Fix Guide

## Problem
Getting "failed to fetch" error when trying to create an account on the landing page (http://localhost:8080).

## Fixes Applied

### 1. ✅ Fixed Environment Variables
**File**: `study-flow-ai-40-main/.env`

**Changed from** (with quotes):
```env
VITE_SUPABASE_URL="https://wcedcqkedhaioymmmuwg.supabase.co"
```

**Changed to** (without quotes):
```env
VITE_SUPABASE_URL=https://wcedcqkedhaioymmmuwg.supabase.co
```

**Why**: Vite doesn't need quotes in `.env` files. Quotes can cause the values to be read incorrectly.

### 2. ✅ Added Better Error Handling
**Files**: 
- `study-flow-ai-40-main/src/pages/Signup.tsx`
- `study-flow-ai-40-main/src/pages/Login.tsx`

Added try-catch blocks to catch network errors and provide better error messages.

### 3. ✅ Added Debug Component
**File**: `study-flow-ai-40-main/src/components/SupabaseDebug.tsx` (NEW)

This component shows real-time status of:
- Environment variables loading
- Supabase connection status
- Any errors that occur

You'll see a small debug panel in the bottom-right corner of the page.

## 🚀 How to Fix Your Issue

### Step 1: Stop the Server
In your terminal where the landing page is running:
```bash
Ctrl+C  # Stop the server
```

### Step 2: Clear Node Cache (Optional but Recommended)
```bash
cd "study-flow-ai-40-main"
rm -rf node_modules/.vite  # Clear Vite cache
# On Windows PowerShell use: Remove-Item -Recurse -Force node_modules/.vite
```

### Step 3: Restart the Server
```bash
npm run dev
```

### Step 4: Clear Browser Cache
1. Open your browser at http://localhost:8080
2. Press **F12** to open DevTools
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click "Clear site data" or "Clear storage"
5. Refresh the page (**Ctrl+R** or **F5**)

### Step 5: Check Debug Panel
Look at the bottom-right corner of the page. You should see:
```
🔍 Supabase Status
✅ Environment Variables
✅ Supabase Connection
```

If you see ❌ instead, check the error message shown.

### Step 6: Try Creating an Account
1. Fill in the signup form
2. Click "Create Account"
3. Watch the browser console (F12 → Console tab) for any errors

## 🔍 Debugging Steps

### Check 1: Environment Variables Loaded?
Open browser console (F12) and type:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
```

**Expected**: Both should show values (not `undefined`)

**If undefined**: 
- Server wasn't restarted after changing `.env`
- `.env` file is in wrong location (should be in `study-flow-ai-40-main/`)

### Check 2: Can You Reach Supabase?
In browser console:
```javascript
fetch('https://wcedcqkedhaioymmmuwg.supabase.co/rest/v1/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected**: Should return some JSON data

**If fails**: 
- Internet connection issue
- Firewall blocking Supabase
- Supabase project is paused

### Check 3: Supabase Project Active?
1. Go to https://supabase.com/dashboard
2. Find your project: `wcedcqkedhaioymmmuwg`
3. Check if it says "Active" or "Paused"
4. If paused, click "Resume project" and wait 1-2 minutes

### Check 4: Check Network Tab
1. Open DevTools (F12) → **Network** tab
2. Try to create an account
3. Look for a request to `https://wcedcqkedhaioymmmuwg.supabase.co/auth/v1/signup`
4. Click on it to see the response
5. Check if there's an error message

## Common Error Messages & Solutions

### "Failed to fetch"
**Cause**: Network issue or Supabase unreachable
**Solutions**:
1. Check internet connection
2. Check if Supabase project is active
3. Disable VPN/proxy temporarily
4. Check firewall settings

### "Missing Supabase environment variables"
**Cause**: `.env` file not loaded
**Solution**: Restart the dev server

### "Invalid API key"
**Cause**: Wrong Supabase key
**Solution**: Verify `.env` file has correct key from Supabase dashboard

### "User already registered"
**Cause**: Email already exists
**Solution**: Try a different email or login instead

### "Password should be at least 6 characters"
**Cause**: Supabase default password requirement
**Solution**: Use a longer password

### "Email rate limit exceeded"
**Cause**: Too many signup attempts
**Solution**: Wait a few minutes and try again

## 📋 Checklist

Before reporting the issue still exists, please verify:

- [ ] Server was restarted after changing `.env`
- [ ] Browser cache was cleared
- [ ] Debug panel shows ✅ for both checks
- [ ] Environment variables show values in console (not undefined)
- [ ] Supabase project is active in dashboard
- [ ] Can access https://wcedcqkedhaioymmmuwg.supabase.co in browser
- [ ] Network tab shows the request being made
- [ ] Console shows the actual error message

## 🆘 Still Not Working?

If you've tried all the above and it still doesn't work, please provide:

1. **Screenshot of debug panel** (bottom-right corner)
2. **Console errors** (F12 → Console tab, screenshot any red errors)
3. **Network tab** (F12 → Network tab, screenshot the failed request)
4. **Environment variable check** (output of the console commands above)
5. **Supabase project status** (screenshot from dashboard)

## 📝 What Changed

### Files Modified:
- ✅ `study-flow-ai-40-main/.env` - Removed quotes from values
- ✅ `study-flow-ai-40-main/src/pages/Signup.tsx` - Added error handling + debug component
- ✅ `study-flow-ai-40-main/src/pages/Login.tsx` - Added error handling + debug component
- ✅ `study-flow-ai-40-main/src/components/SupabaseDebug.tsx` - NEW debug component

### No UI Changes
The login/signup pages still look exactly the same. Only added:
- Better error messages
- Console logging for debugging
- Small debug panel in corner (only in development mode)

---

**Next Step**: Restart the server and try again! 🚀
