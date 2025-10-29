# Quick Database Setup

## Step-by-Step Guide

### 1. Access Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project: **studyai** (or your project name)
3. Click on **SQL Editor** in the left sidebar

### 2. Run Migration for User Data Tables

1. Click **New Query** button
2. Copy the entire content from: `supabase/migrations/create_user_data_tables.sql`
3. Paste it into the SQL editor
4. Click **Run** button (or press Ctrl+Enter)
5. Wait for "Success. No rows returned" message

### 3. Run Migration for User Preferences (if not already done)

1. Click **New Query** button again
2. Copy the entire content from: `supabase/migrations/create_user_preferences_table.sql`
3. Paste it into the SQL editor
4. Click **Run** button
5. Wait for success message

### 4. Verify Tables Were Created

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ tasks
   - ✅ materials
   - ✅ flashcards
   - ✅ flashcard_decks
   - ✅ pomodoro_sessions
   - ✅ schedule_events
   - ✅ user_stats
   - ✅ user_preferences

### 5. Test Authentication

1. Go to **Authentication** → **Users** in Supabase dashboard
2. You should see your test users (if any)
3. Try signing up a new user in your app
4. Verify the user appears in this list

### 6. Test Data Sync

1. Login to your app
2. Create a task or material
3. Go to Supabase **Table Editor** → **tasks** (or **materials**)
4. You should see your data with your `user_id`

## Troubleshooting

### "relation already exists" error
- This means the table was already created
- You can skip this migration
- Or drop the table first: `DROP TABLE IF EXISTS table_name CASCADE;`

### "permission denied" error
- Make sure you're logged into the correct Supabase project
- Verify you have admin access to the project

### Tables not showing in Table Editor
- Refresh the page
- Check the schema is set to "public"
- Verify the SQL ran without errors

### Data not appearing after creating in app
- Check browser console for errors
- Verify `.env` has correct Supabase credentials
- Make sure you're logged in
- Check Network tab for failed requests

## Quick Verification Checklist

- [ ] All 8 tables created successfully
- [ ] RLS policies are enabled (check Table Editor → Policies)
- [ ] Can sign up new users
- [ ] Can login with existing users
- [ ] Data appears in Supabase after creating in app
- [ ] Sync indicator shows "All changes saved"
- [ ] Data persists after page refresh
- [ ] Data persists after logout and login

## Need Help?

Check the full documentation: `AUTHENTICATION_AND_SYNC_SETUP.md`
