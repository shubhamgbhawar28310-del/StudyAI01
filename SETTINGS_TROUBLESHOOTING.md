# Settings Page Troubleshooting Guide 🔧

## Issue: "Failed to load settings" or "Settings Not Available"

This error occurs when the `user_settings` table doesn't exist in your Supabase database yet.

## ✅ Quick Fix (5 minutes)

### Step 1: Run the Database Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL**
   - Open the file `QUICK_SETTINGS_SETUP.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Query**
   - Click "Run" or press Ctrl+Enter
   - Wait for success message: "Settings table created successfully!"

5. **Verify Table Creation**
   - Go to "Table Editor" in left sidebar
   - Look for `user_settings` table
   - You should see all the columns

### Step 2: Refresh Your App

1. Go back to your StudyAI app
2. Navigate to Settings page
3. Click "Retry" button if shown
4. Settings should now load with default values

## 🔍 Verification Checklist

After running the migration, verify:

- [ ] `user_settings` table exists in Supabase
- [ ] Table has all required columns (display_name, email, theme, etc.)
- [ ] RLS (Row Level Security) is enabled
- [ ] Policies are created (4 policies total)
- [ ] Settings page loads without errors
- [ ] You can change and save settings

## 🐛 Common Issues

### Issue 1: "relation user_settings does not exist"
**Solution:** Run the `QUICK_SETTINGS_SETUP.sql` migration

### Issue 2: "permission denied for table user_settings"
**Solution:** 
1. Check if RLS is enabled
2. Verify policies are created
3. Make sure you're logged in

### Issue 3: Settings load but won't save
**Solution:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check if user is authenticated
4. Verify RLS policies allow INSERT/UPDATE

### Issue 4: "Using Default Settings" toast appears
**Solution:** This is normal if the table doesn't exist yet. The app will use default settings until you run the migration.

## 📋 Manual Verification Steps

### Check if table exists:
```sql
SELECT * FROM user_settings LIMIT 1;
```

### Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_settings';
```

### Check your settings:
```sql
SELECT * FROM user_settings WHERE user_id = auth.uid();
```

### Manually insert settings (if needed):
```sql
INSERT INTO user_settings (user_id, email, display_name)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'Your Name'
);
```

## 🔄 Reset Settings

If you want to reset your settings to defaults:

```sql
DELETE FROM user_settings WHERE user_id = auth.uid();
```

Then refresh the Settings page - new defaults will be created.

## 📞 Still Having Issues?

1. **Check Browser Console**
   - Press F12
   - Look for red errors
   - Share error messages

2. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - Click "Logs" in sidebar
   - Look for errors related to user_settings

3. **Verify Environment Variables**
   - Check `.env` file has correct Supabase URL and key
   - Restart dev server after changes

4. **Check Authentication**
   - Make sure you're logged in
   - Try logging out and back in
   - Check if `user` object exists in Settings component

## ✨ Expected Behavior After Fix

Once the migration is run successfully:

1. ✅ Settings page loads immediately
2. ✅ Default values appear for new users
3. ✅ Changes save automatically after 2 seconds
4. ✅ Manual save button works
5. ✅ Theme changes apply instantly
6. ✅ All toggles and inputs work
7. ✅ Password change works
8. ✅ Data export works
9. ✅ No error messages appear

## 🎯 Quick Test

After running the migration, test these:

1. Change your display name → Should auto-save
2. Toggle theme → Should apply immediately
3. Change daily goal → Should save
4. Toggle a notification → Should save
5. Refresh page → Settings should persist

If all these work, you're good to go! 🎉

## 📝 Notes

- The app will work with default settings even if the table doesn't exist
- Settings will only persist after the migration is run
- Auto-save happens 2 seconds after changes
- All data is user-specific (RLS protected)
- Email cannot be changed from the UI (security)

## 🚀 Next Steps

Once settings are working:
1. Customize your preferences
2. Set your daily study goal
3. Configure Pomodoro timers
4. Enable notifications you want
5. Choose your preferred theme

Everything should now work perfectly! 🎊
