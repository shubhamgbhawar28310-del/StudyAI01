# 🔧 Troubleshooting: Data Not Saving

## Quick Diagnosis

### Step 1: Run the Diagnostic Tool

Open this URL in your browser while the app is running:
```
http://localhost:5173/diagnostic.html
```

This will automatically check:
- ✅ Supabase connection
- ✅ User authentication status
- ✅ Database tables existence
- ✅ Data insert/update permissions

### Step 2: Check Browser Console

1. Open your app in the browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Try creating a task or material
5. Look for error messages (red text)

Common errors you might see:

#### Error: "relation 'tasks' does not exist"
**Problem**: Database tables haven't been created
**Solution**: Run the migrations (see Step 3 below)

#### Error: "new row violates row-level security policy"
**Problem**: RLS policies are blocking access
**Solution**: Check if you're logged in, or re-run migrations

#### Error: "Failed to fetch" or "Network error"
**Problem**: Can't connect to Supabase
**Solution**: Check your internet connection and `.env` file

### Step 3: Run Database Migrations

**This is the most common issue!** The database tables need to be created first.

#### Quick Fix:

1. Go to: https://app.supabase.com
2. Select your project: **studyai** (or your project name)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the ENTIRE content from this file:
   ```
   supabase/migrations/create_user_data_tables.sql
   ```
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success. No rows returned" message

#### Verify Tables Were Created:

1. In Supabase Dashboard, click **Table Editor**
2. You should see these tables:
   - tasks
   - materials
   - flashcards
   - flashcard_decks
   - pomodoro_sessions
   - schedule_events
   - user_stats

### Step 4: Verify You're Logged In

Data will only save if you're logged in!

1. Check the top-right corner of your app
2. You should see your email or profile
3. If not, go to `/login` and sign in
4. After login, try creating data again

### Step 5: Check Environment Variables

Make sure your `.env` file has the correct values:

```env
VITE_SUPABASE_URL=https://crdqpioymuvnzhtgrenj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**After changing `.env`:**
1. Stop the dev server (Ctrl+C)
2. Restart it: `npm run dev`

## Common Issues & Solutions

### Issue 1: "Data disappears after refresh"

**Diagnosis:**
- Data saves to localStorage but not Supabase
- Database tables don't exist

**Solution:**
```bash
# Run the migrations in Supabase Dashboard
# See Step 3 above
```

### Issue 2: "Sync indicator shows error"

**Diagnosis:**
- Check browser console for specific error
- Usually means tables don't exist or RLS blocking

**Solution:**
1. Run migrations (Step 3)
2. Make sure you're logged in
3. Check browser console for specific error

### Issue 3: "Can't login"

**Diagnosis:**
- Supabase Auth not configured
- Wrong credentials

**Solution:**
1. Verify Supabase project is active
2. Check Auth settings in Supabase Dashboard
3. Try signing up a new account
4. Check browser console for errors

### Issue 4: "Data saves but doesn't show after logout/login"

**Diagnosis:**
- Data is saving but not loading
- `fetchAllUserData` might be failing

**Solution:**
1. Check browser console when logging in
2. Look for errors in Network tab
3. Verify user_id matches in database

### Issue 5: "Some data saves, but not all"

**Diagnosis:**
- Some tables exist, others don't
- Partial migration

**Solution:**
1. Re-run the complete migration file
2. Or run migrations for missing tables individually

## Manual Verification

### Check if data is actually in Supabase:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select **tasks** table
4. You should see your tasks with your `user_id`
5. Check other tables too

### Check if you can manually insert data:

1. In Supabase Dashboard, go to **Table Editor**
2. Select **tasks** table
3. Click **Insert row**
4. Fill in:
   - user_id: (your user ID from Auth → Users)
   - title: "Test Task"
   - completed: false
   - priority: "medium"
   - progress: 0
5. Click **Save**
6. If it saves, the table works!

## Still Not Working?

### Enable Debug Logging

Add this to your browser console:
```javascript
localStorage.setItem('debug', 'supabase:*');
```

Then refresh and try creating data. You'll see detailed logs.

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** → **API Logs**
3. Try creating data in your app
4. Watch for errors in real-time

### Verify RLS Policies

Run this in Supabase SQL Editor:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'materials', 'flashcards');

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'tasks';
```

All tables should have `rowsecurity = true` and 4 policies each.

## Quick Test Script

Run this in your browser console (while logged in):

```javascript
// Test if you can save data
const { supabase } = await import('/src/lib/supabase.ts');

// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Try to insert a task
const { data, error } = await supabase.from('tasks').insert({
  user_id: user.id,
  title: 'Console Test Task',
  completed: false,
  priority: 'low',
  progress: 0,
  pomodoro_sessions: 0,
  flashcards_generated: false
}).select();

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Success:', data);
}
```

## Migration Checklist

Before reporting an issue, verify:

- [ ] Ran `create_user_data_tables.sql` in Supabase SQL Editor
- [ ] All 7 tables appear in Table Editor
- [ ] User is logged in (check top-right corner)
- [ ] `.env` file has correct Supabase credentials
- [ ] Restarted dev server after changing `.env`
- [ ] Browser console shows no errors
- [ ] Diagnostic tool passes all tests
- [ ] Can manually insert data in Supabase Table Editor

## Get Help

If you've tried everything above:

1. **Check browser console** - Screenshot any errors
2. **Check Supabase logs** - Look for failed requests
3. **Run diagnostic tool** - Share the results
4. **Check Network tab** - Look for failed API calls (red)

### What to include when asking for help:

1. Browser console errors (screenshot)
2. Diagnostic tool results
3. Supabase logs (if any errors)
4. What you were trying to do when it failed
5. Whether migrations were run successfully

---

**Most Common Solution**: 90% of the time, the issue is that database migrations haven't been run. Go to Supabase Dashboard → SQL Editor → Run the migration file!
