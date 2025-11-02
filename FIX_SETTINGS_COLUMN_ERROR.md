# Fix: "Could not find the 'achievements' column" Error

## Problem
You're getting an error: `Could not find the 'achievements' column of 'user_settings' in the schema cache`

This happens when Supabase's schema cache is out of sync with the actual database table.

## ✅ Solution (Choose One)

### Option 1: Refresh Schema Cache (Quick - Try This First)

1. **Go to Supabase Dashboard**
2. **Settings → API**
3. **Click "Restart Server"** or **"Reload Schema"**
4. **Wait 30 seconds**
5. **Try saving settings again**

### Option 2: Recreate Table (If Option 1 Doesn't Work)

1. **Open Supabase SQL Editor**
2. **Copy and paste** the contents of `FIX_SETTINGS_SCHEMA.sql`
3. **Run the query**
4. **Wait for success message**
5. **Refresh your app**

### Option 3: Manual Schema Verification

Run this in Supabase SQL Editor to check your table:

```sql
-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;
```

You should see these columns:
- id
- user_id
- display_name
- email
- theme
- language
- daily_study_goal
- pomodoro_length
- break_length
- auto_start_breaks
- study_reminders
- task_deadlines
- **achievements** ← This one should be there!
- weekly_report
- created_at
- updated_at

## 🔍 Why This Happens

1. **Schema Cache**: Supabase caches the database schema for performance
2. **Out of Sync**: If the table was created/modified, the cache might be outdated
3. **Column Names**: The cache doesn't recognize the column names

## ✅ What I Fixed in the Code

I updated `src/services/settingsService.ts` to:
- Explicitly list all columns when saving
- Better error handling
- More reliable upsert operation

## 🧪 Test After Fix

1. **Go to Settings page**
2. **Change your display name**
3. **Wait 2 seconds** (auto-save)
4. **You should see**: "Settings auto-saved" toast
5. **Refresh the page**
6. **Your changes should persist**

## 🚨 If Still Not Working

### Check 1: Verify Table Exists
```sql
SELECT * FROM user_settings LIMIT 1;
```

### Check 2: Verify RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_settings';
```
You should see 4 policies (SELECT, INSERT, UPDATE, DELETE)

### Check 3: Check Your User ID
```sql
SELECT auth.uid();
```
Make sure this returns a valid UUID

### Check 4: Try Manual Insert
```sql
INSERT INTO user_settings (
  user_id, display_name, email, theme
) VALUES (
  auth.uid(), 'Test', 'test@test.com', 'dark'
);
```

If this works, the table is fine and it's a cache issue.

## 🔄 Force Schema Reload

Run this in SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

Then wait 30 seconds and try again.

## 📝 Alternative: Use Supabase Studio

1. Go to **Table Editor**
2. Find **user_settings** table
3. Click **"..."** menu
4. Select **"Refresh"**
5. Try saving settings again

## ✅ Expected Result

After applying the fix:
- ✅ No more column errors
- ✅ Settings save successfully
- ✅ Auto-save works
- ✅ Changes persist after refresh
- ✅ All toggles and inputs work

## 🎯 Quick Checklist

- [ ] Run `FIX_SETTINGS_SCHEMA.sql` in Supabase
- [ ] Wait for "Table created successfully!" message
- [ ] Refresh your app (Ctrl+R or Cmd+R)
- [ ] Go to Settings page
- [ ] Make a change
- [ ] Wait 2 seconds
- [ ] See "Settings auto-saved" toast
- [ ] Refresh page
- [ ] Changes should persist

## 💡 Pro Tip

After running any SQL migration in Supabase:
1. Always wait 30-60 seconds
2. Refresh the Supabase dashboard
3. Then test your app

This gives Supabase time to update its schema cache.

## 🆘 Still Having Issues?

1. **Check browser console** (F12) for detailed errors
2. **Check Supabase logs** (Dashboard → Logs)
3. **Try logging out and back in**
4. **Clear browser cache**
5. **Restart your dev server**

The fix should work! The code is now more robust and explicitly handles all columns. 🎉
