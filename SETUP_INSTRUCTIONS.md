# Quick Setup Instructions

## Step 1: Run Database Migration

Run the comprehensive integration migration in your Supabase SQL Editor:

```bash
# Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of: supabase/migrations/COMPREHENSIVE_INTEGRATION.sql
4. Paste and click "Run"

# Option 2: Using Supabase CLI
supabase db push
```

## Step 2: Verify Migration

Check that everything was created successfully:

```sql
-- Check materials table
SELECT COUNT(*) FROM materials;

-- Check user_settings table
SELECT COUNT(*) FROM user_settings;

-- Check new columns in schedule_events
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'schedule_events' 
AND column_name IN ('actual_duration', 'pomodoro_count', 'break_count');

-- Check database functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN (
  'auto_create_material_from_task_file',
  'get_event_with_task_data',
  'complete_study_session'
);
```

## Step 3: Test the Features

### Test 1: File Upload to Material Manager
1. Create a new task
2. Upload a file (PDF, image, or document)
3. Go to Material Manager
4. Verify the file appears there with the task linked

### Test 2: Pomodoro Timer
1. Go to Study Planner
2. Click on any event (or create one)
3. Click the "Timer" tab
4. Start a Pomodoro session
5. Let it complete (or skip for testing)
6. Check that task progress increased

### Test 3: Dynamic Schedule
1. Navigate to Study Planner
2. Verify the schedule shows time slots from 6 AM to 11 PM
3. Check that it auto-scrolls to current time
4. Click on any empty time slot to create an event
5. Verify status dots show event states

### Test 4: Fresh Data Loading
1. Open an event in Study Session Modal
2. Make changes to the linked task in another tab
3. Click "Refresh Task Data" button
4. Verify changes appear immediately

## Step 4: Configure Settings (Optional)

Users can customize Pomodoro settings:
1. Go to Settings
2. Navigate to Study Preferences
3. Adjust:
   - Pomodoro Length (default: 25 min)
   - Break Length (default: 5 min)
   - Auto-start breaks (default: ON)

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Some columns may already exist. The migration uses `IF NOT EXISTS` but if you have conflicts, you can:
```sql
-- Drop and recreate (CAUTION: This will lose data)
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
-- Then run the migration again
```

### Issue: Files not creating materials
**Solution**: Check the trigger:
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_create_material';

-- If missing, recreate it
CREATE TRIGGER trigger_auto_create_material
  BEFORE INSERT ON task_files
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_material_from_task_file();
```

### Issue: Pomodoro timer not updating progress
**Solution**: Verify the function exists:
```sql
-- Check function
SELECT * FROM pg_proc WHERE proname = 'complete_study_session';

-- Test it manually
SELECT complete_study_session(
  'your-event-id'::uuid,
  'your-user-id'::uuid,
  25, -- duration in minutes
  1   -- pomodoro count
);
```

### Issue: Schedule not scrolling
**Solution**: Clear browser cache and reload. The scroll happens on component mount.

## What's New?

### ✨ Features Added
1. **Material Manager Integration**
   - Files uploaded to tasks automatically create materials
   - View files from both Task Detail and Material Manager
   - Bidirectional linking with `linked_task_id`

2. **Pomodoro Timer**
   - Full Pomodoro technique implementation
   - 25min work + 5min short break + 15min long break
   - Customizable durations in settings
   - Auto-start breaks option
   - Progress tracking per Pomodoro

3. **Dynamic Schedule View**
   - Scrollable time grid (6 AM - 11 PM)
   - Auto-scroll to current time
   - Current time indicator (blue line)
   - Status dots for events
   - Click to create events

4. **Fresh Data Loading**
   - Study Session Modal fetches fresh data on open
   - Manual refresh button
   - No cached data issues
   - Always shows current task state

5. **Bidirectional Sync**
   - Complete event → task marked complete
   - Complete Pomodoro → task progress increases
   - Task status syncs with event status
   - Automatic updates across all views

## Next Steps

After setup is complete:
1. Read `COMPREHENSIVE_INTEGRATION_GUIDE.md` for detailed documentation
2. Test all features with real data
3. Configure user settings for optimal experience
4. Train users on new Pomodoro timer workflow
5. Monitor database performance with new indexes

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database migration completed successfully
3. Check Supabase logs for RPC call errors
4. Review RLS policies for permission issues
5. Refer to troubleshooting section above

---

**Ready to go!** 🚀 Your comprehensive integration is now set up and ready to use.
