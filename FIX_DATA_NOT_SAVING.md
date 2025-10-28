# 🚨 URGENT FIX: Data Not Saving

## The Problem

Your data isn't being saved because **the database tables don't exist yet**.

## The Solution (5 Minutes)

### Step 1: Open Supabase Dashboard

1. Go to: **https://app.supabase.com**
2. Login if needed
3. Click on your project (should be named something like "studyai")

### Step 2: Open SQL Editor

1. Look at the left sidebar
2. Click on **"SQL Editor"** (it has a </> icon)
3. Click the **"New Query"** button

### Step 3: Copy the Migration File

1. Open this file in your code editor:
   ```
   supabase/migrations/create_user_data_tables.sql
   ```

2. Select ALL the text (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 4: Run the Migration

1. Go back to Supabase SQL Editor
2. Paste the SQL code (Ctrl+V)
3. Click the **"Run"** button (or press Ctrl+Enter)
4. Wait for the message: **"Success. No rows returned"**

### Step 5: Verify Tables Were Created

1. In Supabase Dashboard, click **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - ✅ tasks
   - ✅ materials
   - ✅ flashcards
   - ✅ flashcard_decks
   - ✅ pomodoro_sessions
   - ✅ schedule_events
   - ✅ user_stats

### Step 6: Test It!

1. Go back to your app: http://localhost:5173
2. Make sure you're logged in
3. Create a task or upload a material
4. Refresh the page (F5)
5. **Your data should still be there!** ✅

## Quick Diagnostic

If you want to verify everything is working, open this in your browser:

```
http://localhost:5173/diagnostic.html
```

This will automatically check:
- ✅ Supabase connection
- ✅ Database tables
- ✅ Login status
- ✅ Data permissions

## Still Not Working?

### Check if you're logged in:
- Look at the top-right corner of your app
- You should see your email or a profile icon
- If not, click "Login" and sign in

### Check browser console:
1. Press F12
2. Click "Console" tab
3. Look for red error messages
4. Common errors:
   - "relation 'tasks' does not exist" → Run migrations (Step 2-4)
   - "row-level security policy" → Make sure you're logged in
   - "Failed to fetch" → Check internet connection

### Restart the dev server:
```bash
# Stop the server (Ctrl+C in terminal)
# Start it again:
npm run dev
```

## What Changed?

Before: Data was only saved to localStorage (browser storage)
- ❌ Lost on logout
- ❌ Not synced across devices
- ❌ No backup

After: Data is saved to Supabase (cloud database)
- ✅ Persists forever
- ✅ Synced across devices
- ✅ Cloud backup
- ✅ Never lost

## Need More Help?

See the detailed troubleshooting guide:
- `TROUBLESHOOTING_DATA_SYNC.md`

Or check the full setup documentation:
- `AUTHENTICATION_AND_SYNC_SETUP.md`

---

**TL;DR**: 
1. Go to https://app.supabase.com
2. SQL Editor → New Query
3. Paste content from `supabase/migrations/create_user_data_tables.sql`
4. Click Run
5. Done! ✅
