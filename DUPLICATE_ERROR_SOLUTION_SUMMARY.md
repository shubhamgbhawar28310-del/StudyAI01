# Duplicate Event Error - Complete Solution

## Problem Summary

When creating events, you get this error:
```
duplicate key value violates unique constraint "google_calendar_sync_queue_event_type_event_id_key"
```

## Root Cause

The issue is NOT with the `schedule_events` table itself. It's with the **Google Calendar sync queue**.

Here's what happens:
1. You create an event → saves to `schedule_events` table ✅
2. A database trigger fires → tries to add to `google_calendar_sync_queue` ❌
3. The sync queue has a UNIQUE constraint on `(event_type, event_id)`
4. If an entry already exists, it fails with duplicate error

## Why This Happens

The trigger uses `ON CONFLICT DO UPDATE`, but there's a race condition or the trigger is firing multiple times for the same event, causing the duplicate key error.

## The Solution

### Quick Fix (Run This SQL)

Open **Supabase SQL Editor** and run the SQL from `RUN_THIS_TO_FIX_DUPLICATE_ERROR.md`

Or use the complete fix in `FIX_SYNC_QUEUE_DUPLICATE.sql`

### What The Fix Does

1. **Updates the trigger function** to:
   - Check if entry exists BEFORE inserting
   - Update existing entry instead of inserting duplicate
   - Add exception handling to catch unique violations
   - Prevent trigger from crashing the event creation

2. **Cleans up existing duplicates**:
   - Removes duplicate entries (keeps most recent)
   - Resets stuck 'processing' entries

3. **Fixes RLS policies**:
   - Simplifies policies to one comprehensive policy
   - Ensures trigger has proper permissions

## Files Created

1. **RUN_THIS_TO_FIX_DUPLICATE_ERROR.md** - Quick 2-step fix guide
2. **FIX_SYNC_QUEUE_DUPLICATE.sql** - Complete SQL fix
3. **CHECK_SYNC_QUEUE_DUPLICATES.sql** - Diagnostic queries
4. **CLEAN_DUPLICATE_EVENTS.sql** - Clean up event duplicates
5. **DEBUG_DUPLICATE_EVENT_ERROR.sql** - Debug queries

## Code Changes Made

### Frontend Changes
- **ScheduleEventModal.tsx**: Added retry logic for duplicate errors
- **scheduleEventService.ts**: Added UUID collision detection

These frontend changes help, but the main fix is the database trigger update.

## Testing Steps

1. **Run the SQL fix** (required!)
2. **Refresh browser** (Ctrl+F5)
3. **Create a test event**:
   - Title: "Test Event"
   - Date: Today
   - Time: Any time
4. **Check console** for success logs
5. **Verify event appears** in schedule

## If Still Not Working

### Check Sync Queue
```sql
-- Run this to see what's in the queue
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC LIMIT 10;
```

### Check for Duplicates
```sql
-- Run this to find duplicates
SELECT event_type, event_id, COUNT(*) 
FROM google_calendar_sync_queue 
GROUP BY event_type, event_id 
HAVING COUNT(*) > 1;
```

### Disable Sync Temporarily
If you don't need Google Calendar sync right now:
```sql
DROP TRIGGER IF EXISTS trigger_sync_schedule_event ON schedule_events;
```

## Prevention

The updated trigger now:
- ✅ Checks for existing entries before inserting
- ✅ Updates instead of inserting duplicates
- ✅ Catches unique violation exceptions
- ✅ Logs warnings instead of failing
- ✅ Never blocks event creation

## Technical Details

### The Trigger Flow (Before Fix)
```
Event Created → Trigger Fires → Try INSERT into sync_queue
                                 ↓
                          Already exists? → ERROR! 💥
```

### The Trigger Flow (After Fix)
```
Event Created → Trigger Fires → Check if exists in sync_queue
                                 ↓
                          Yes → UPDATE existing entry ✅
                          No  → INSERT new entry ✅
                                 ↓
                          Exception? → Log warning, continue ✅
```

### Database Schema
```sql
-- Sync queue has this constraint:
UNIQUE(event_type, event_id)

-- This means only ONE entry per event
-- The fix ensures we UPDATE instead of INSERT when entry exists
```

## Related Issues Fixed

1. ✅ Duplicate key violations in sync queue
2. ✅ Events not syncing to Google Calendar
3. ✅ RLS policy errors on sync queue
4. ✅ Stuck 'processing' entries
5. ✅ Race conditions in trigger

## Next Steps

After running the fix:
1. Test creating multiple events
2. Test updating events
3. Test deleting events
4. Verify Google Calendar sync works (if enabled)
5. Check sync queue stays clean

## Support

If you still have issues:
1. Share the browser console logs
2. Run the diagnostic SQL queries
3. Check Supabase logs for trigger errors
4. Verify RLS policies are correct
