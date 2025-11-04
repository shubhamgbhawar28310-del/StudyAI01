# Fix: Duplicate Event Error

## Problem
Users are getting "Duplicate Event - An event with this ID already exists" error when trying to create events, even with different event names.

## Root Causes Identified

### 1. Double Insertion Issue
The modal was calling both:
- `scheduleEventService.createEvent()` - saves to Supabase
- `addScheduleEvent()` - which could trigger another Supabase insert

### 2. Possible UUID Collision
Although extremely rare, UUID collisions could occur if:
- Browser crypto API is not working properly
- Multiple rapid submissions
- Database already has stale data

### 3. Race Condition
If user clicks "Create Event" multiple times quickly, multiple requests could be sent with the same or different IDs.

## Fixes Applied

### 1. Updated Modal (ScheduleEventModal.tsx)
- Added `isLoading` state to prevent double submissions
- Modal now passes the complete saved event (with ID) to `addScheduleEvent`
- The context will recognize the ID and skip the Supabase sync

### 2. Updated Service (scheduleEventService.ts)
- Added UUID collision detection with retry logic (up to 3 attempts)
- Enhanced error logging to show the conflicting event
- Better error messages for debugging

### 3. Context Already Has Protection (StudyPlannerContext.tsx)
- `addScheduleEvent` checks if event already exists by title/time
- Only syncs to Supabase if no ID is provided
- This prevents duplicate inserts

## How to Test

### 1. Run the Debug SQL
```sql
-- Run this in Supabase SQL Editor
-- Check for any duplicate IDs
SELECT id, COUNT(*) as count
FROM schedule_events
GROUP BY id
HAVING COUNT(*) > 1;

-- Check recent events
SELECT id, user_id, title, start_time, created_at
FROM schedule_events
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Clear Existing Data (if needed)
If you have corrupted data, you can clear your events:
```sql
-- CAUTION: This deletes all your schedule events!
-- Only run if you want to start fresh
DELETE FROM schedule_events WHERE user_id = 'YOUR_USER_ID';
```

### 3. Test Event Creation
1. Open the Study Planner
2. Click "Create Event"
3. Fill in event details
4. Click "Create Event" button
5. Check browser console for detailed logs
6. Event should be created successfully

### 4. Test Rapid Clicks
1. Try clicking "Create Event" button multiple times rapidly
2. Should only create one event (button is disabled while loading)

## If Error Still Occurs

### Check Browser Console
Look for these log messages:
- `🚀 Starting event creation...`
- `🆔 Generated UUID: ...`
- `✅ UUID is unique`
- `📤 Sending event data: ...`
- `✅ Event saved successfully: ...`

### If You See UUID Collision
```
⚠️ UUID collision detected! Generating new one...
```
This means the UUID already exists in the database. The service will automatically retry with a new UUID.

### If You See Duplicate Key Error
```
❌ Duplicate key error - ID already exists in database
```
Check the console for the "Conflicting event in database" log to see what event is causing the conflict.

## Manual Fix: Clear Browser Cache

Sometimes the issue is caused by stale data in browser storage:

1. Open DevTools (F12)
2. Go to Application tab
3. Clear all storage:
   - Local Storage
   - Session Storage
   - IndexedDB
4. Refresh the page
5. Log in again
6. Try creating an event

## Database Schema Check

Make sure your `schedule_events` table has the correct schema:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'schedule_events'
ORDER BY ordinal_position;

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'schedule_events';
```

The `id` column should be:
- Type: `uuid`
- Primary Key: Yes
- Nullable: No
- Default: None (we generate UUIDs in the app)

## Prevention

The fixes ensure:
1. ✅ No double submissions (button disabled while loading)
2. ✅ UUID collision detection with retry
3. ✅ No duplicate Supabase inserts (context checks for existing ID)
4. ✅ Better error messages for debugging
5. ✅ Detailed console logging

## Next Steps

If the error persists after these fixes:
1. Run the debug SQL to check for duplicate IDs
2. Check browser console for detailed error logs
3. Clear browser cache and try again
4. If still failing, check Supabase RLS policies
5. Verify user authentication is working correctly
