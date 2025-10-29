# 🔧 Troubleshooting Guide

## "Failed to Fetch" Error on Login

### Possible Causes & Solutions:

### 1. ✅ **Environment Variables Not Loaded**
**Problem**: The `.env` file variables aren't being read by Vite.

**Solution**: 
- Stop the dev server (Ctrl+C)
- Restart it: `npm run dev`
- Vite only loads `.env` files on startup

### 2. ✅ **Supabase Project Issues**
**Problem**: Your Supabase project might be paused or have network issues.

**Solution**:
1. Go to https://supabase.com/dashboard
2. Check if your project `wcedcqkedhaioymmmuwg` is active
3. If paused, click "Resume project"
4. Wait for it to fully start (can take 1-2 minutes)

### 3. ✅ **CORS Issues**
**Problem**: Supabase might not allow requests from localhost:8080

**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these to "Site URL" and "Redirect URLs":
   - `http://localhost:8080`
   - `http://localhost:8080/login`
   - `http://localhost:8080/signup`
   - `http://localhost:5173`
   - `http://localhost:5173/`

### 4. ✅ **Network/Firewall Issues**
**Problem**: Your firewall or antivirus is blocking Supabase API calls.

**Solution**:
- Temporarily disable firewall/antivirus
- Check if you can access https://wcedcqkedhaioymmmuwg.supabase.co in browser
- If not, check your internet connection

### 5. ✅ **Browser Console Errors**
**Problem**: There might be JavaScript errors preventing the request.

**Solution**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests
5. Share the error message for more specific help

## Quick Test Steps:

### Step 1: Verify Supabase Connection
Open browser console and run:
```javascript
fetch('https://wcedcqkedhaioymmmuwg.supabase.co/rest/v1/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this fails, it's a Supabase connectivity issue.

### Step 2: Check Environment Variables
In your browser console on http://localhost:8080:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
```

Both should show values. If `undefined`, restart the dev server.

### Step 3: Test Login API Call
Open browser DevTools → Network tab → Try to login → Look for:
- Request to `https://wcedcqkedhaioymmmuwg.supabase.co/auth/v1/token?grant_type=password`
- Check the response status and error message

## Common Error Messages:

### "Missing Supabase environment variables"
- **Cause**: `.env` file not loaded
- **Fix**: Restart dev server

### "Invalid API key"
- **Cause**: Wrong Supabase key in `.env`
- **Fix**: Copy correct key from Supabase dashboard

### "Email not confirmed"
- **Cause**: Email verification required
- **Fix**: Check email or disable email confirmation in Supabase

### "Invalid login credentials"
- **Cause**: Wrong email/password
- **Fix**: Try signing up first, then login

## Still Not Working?

1. **Clear browser cache and localStorage**:
   - Open DevTools → Application → Storage → Clear site data

2. **Try a different browser**:
   - Test in Chrome/Firefox/Edge incognito mode

3. **Check Supabase logs**:
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

4. **Verify .env file location**:
   - Must be in `study-flow-ai-40-main/.env`
   - Not in a subdirectory

5. **Check file contents**:
   ```bash
   cd study-flow-ai-40-main
   cat .env
   ```
   Should show:
   ```
   VITE_SUPABASE_PROJECT_ID="wcedcqkedhaioymmmuwg"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
   VITE_SUPABASE_URL="https://wcedcqkedhaioymmmuwg.supabase.co"
   ```

## Need More Help?

Share these details:
1. Exact error message from browser console
2. Network tab screenshot showing failed request
3. Output of environment variable check (Step 2 above)
4. Whether Supabase project is active in dashboard
