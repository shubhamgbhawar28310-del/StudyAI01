# 🎯 Final Setup Steps - Google Calendar Integration

## Current Status

✅ **Completed**:
- Database migrations run
- Sync worker running (PM2)
- OAuth credentials created
- Test user added
- Frontend code ready

❌ **Missing** (Causing the errors):
- Edge Functions not deployed
- Secrets not set

---

## 🚀 What You Need to Do Now (10 minutes)

### Step 1: Deploy Edge Functions (8 minutes)

Go to: https://app.supabase.com/ → Your Project → **Edge Functions**

**Deploy these 3 functions** (copy code from the files):

#### Function 1: google-calendar-auth
- Name: `google-calendar-auth`
- Code: Copy from `supabase/functions/google-calendar-auth/index.ts`
- Click Deploy

#### Function 2: google-calendar-sync  
- Name: `google-calendar-sync`
- Code: Copy from `supabase/functions/google-calendar-sync/index.ts`
- Click Deploy

#### Function 3: google-calendar-worker
- Name: `google-calendar-worker`
- Code: Copy from `supabase/functions/google-calendar-worker/index.ts`
- Click Deploy

### Step 2: Set Secrets (2 minutes)

Go to: **Project Settings** → **Edge Functions** → **Secrets**

Add these 3 secrets:

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `GOOGLE_CLIENT_ID` | Your Client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret | Google Cloud Console → Credentials |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5173/auth/google/callback` | Type this exactly |

---

## ✅ After Deployment

### Test the Integration

1. **Refresh your app** (Ctrl+R or Cmd+R)
2. Go to **Settings → Notifications**
3. Click **"Connect Calendar"**
4. Sign in with Google
5. Grant permissions
6. Should see: **✅ Connected as your@email.com**

### Create a Test Event

1. Go to **Study Planner**
2. Create a new study session
3. Wait **5 minutes** (worker syncs every 5 minutes)
4. Check **Google Calendar**
5. Should see: **📚 Your Study Session**

---

## 🐛 Current Errors Explained

### Error 1: "Failed to load resource: net::ERR_FAILED"
**Cause**: Edge Functions don't exist yet
**Fix**: Deploy the 3 Edge Functions

### Error 2: "CORS policy error"
**Cause**: Functions not deployed, so CORS headers not returned
**Fix**: Deploy the functions (they include CORS headers)

### Error 3: "Connection canceled"
**Cause**: `google-calendar-auth` function doesn't exist
**Fix**: Deploy `google-calendar-auth` function

### Error 4: "session_notes 404"
**Cause**: Unrelated - missing table (not critical for Google Calendar)
**Fix**: Ignore for now, or create the table if needed

---

## 📊 Deployment Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to Edge Functions
- [ ] Deploy `google-calendar-auth`
- [ ] Deploy `google-calendar-sync`
- [ ] Deploy `google-calendar-worker`
- [ ] Go to Project Settings → Edge Functions
- [ ] Add secret: `GOOGLE_CLIENT_ID`
- [ ] Add secret: `GOOGLE_CLIENT_SECRET`
- [ ] Add secret: `GOOGLE_REDIRECT_URI`
- [ ] Refresh app
- [ ] Test OAuth connection
- [ ] Create study session
- [ ] Wait 5 minutes
- [ ] Check Google Calendar

---

## 📁 Files You Need

All function code is in these files (just copy and paste):
- `supabase/functions/google-calendar-auth/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-calendar-worker/index.ts`

---

## 🎯 Quick Reference

### Google Cloud Console
https://console.cloud.google.com/apis/credentials

### Supabase Dashboard
https://app.supabase.com/

### Your Project URL
https://crdqpioymuvnzhtgrenj.supabase.co

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ No CORS errors in console
2. ✅ OAuth connection succeeds
3. ✅ Shows "Connected as your@email.com"
4. ✅ Study sessions appear in Google Calendar
5. ✅ PM2 worker shows "Processed: X events"

---

## 🆘 Need Help?

### Check Function Logs
1. Go to Edge Functions in Supabase
2. Click on a function
3. Click "Logs" tab
4. See any errors

### Check Worker Logs
```bash
pm2 logs google-calendar-sync
```

### Check Sync Queue
```sql
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

---

**Deploy the Edge Functions now and everything will work! 🚀**

**Detailed guide**: `DEPLOY_EDGE_FUNCTIONS_NOW.md`
