# 🔧 Complete Study Planner Fix - End-to-End Solution

## 🎯 Problem Analysis

The Study Planner frontend can't save events because:

1. **RLS Policy Issues** - 403 Forbidden errors
2. **Status Constraint Issues** - Invalid status values
3. **Data Format Mismatch** - Frontend sends camelCase, DB expects snake_case
4. **Missing Default Values** - Required fields not set

## ✅ Complete Solution

### Step 1: Fix Database Schema & Policies

Run this SQL in Supabase SQL Editor:

```sql
-- =====================================================
-- COMPLETE STUDY PLANNER DATABASE FIX
-- =====================================================

-- Step 1: Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view their own schedule events" ON schedule_events;
DROP POLICY IF EXISTS "Users can insert their own schedule events" ON schedule_events;
DROP POLICY IF EXISTS "Users can update their own schedule events" ON schedule_events;
DROP POLICY IF EXISTS "Users can delete their own schedule events" ON schedule_events;

-- Step 2: Create proper RLS policies
CREATE POLICY "Users can view their own schedule events"
ON schedule_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule events"
ON schedule_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule events"
ON schedule_events
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule events"
ON schedule_events
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Fix status constraint
ALTER TABLE schedule_events DROP CONSTRAINT IF EXISTS schedule_events_status_check;
ALTER TABLE schedule_events 
ADD CONSTRAINT schedule_events_status_check 
CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'upcoming', 'missed'));

-- Step 4: Add helpful defaults
ALTER TABLE schedule_events 
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN status SET DEFAULT 'scheduled',
ALTER COLUMN type SET DEFAULT 'study',
ALTER COLUMN missed_count SET DEFAULT 0,
ALTER COLUMN synced_to_google SET DEFAULT false;

-- Step 5: Test insert (should work now)
INSERT INTO schedule_events (
  user_id,
  title,
  description,
  start_time,
  end_time
) VALUES (
  auth.uid(),
  'Test Frontend Fix',
  'Testing if frontend can save now',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '4 hours'
);

-- Step 6: Verify it was created and synced
SELECT 
  id,
  title,
  status,
  synced_to_google
FROM schedule_events 
WHERE title = 'Test Frontend Fix';

-- Check sync queue
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 3;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema fixed!';
    RAISE NOTICE '✅ RLS policies updated';
    RAISE NOTICE '✅ Status constraint relaxed';
    RAISE NOTICE '✅ Default values added';
    RAISE NOTICE 'Frontend should work now!';
END $$;
```

### Step 2: Enhanced Error Handling in Frontend

I'll update the dataSyncService to handle errors better:

```typescript
// Enhanced syncScheduleEvent with better error handling
async syncScheduleEvent(event: ScheduleEvent, userId: string, operation: 'insert' | 'update' | 'delete') {
  try {
    this.setSyncStatus('syncing');
    
    // Prepare data with proper field mapping
    const eventData = {
      id: event.id,
      user_id: userId,
      title: event.title,
      description: event.description || null,
      start_time: event.startTime,
      end_time: event.endTime,
      type: event.type || 'study',
      task_id: event.taskId || null,
      color: event.color || null,
      status: event.status || 'scheduled',
      missed_count: event.missedCount || 0,
      started_at: event.startedAt || null,
      completed_at: event.completedAt || null,
      synced_to_google: false,
      created_at: operation === 'insert' ? new Date().toISOString() : undefined
    };

    let result;
    if (operation === 'delete') {
      result = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', event.id)
        .eq('user_id', userId);
    } else if (operation === 'insert') {
      result = await supabase
        .from('schedule_events')
        .insert(eventData);
    } else {
      result = await supabase
        .from('schedule_events')
        .update(eventData)
        .eq('id', event.id)
        .eq('user_id', userId);
    }

    if (result.error) {
      console.error('❌ Supabase error syncing schedule event:', result.error);
      console.error('Operation:', operation, 'Event:', event);
      console.error('Data sent:', eventData);
      this.setSyncStatus('error');
      throw result.error;
    }

    console.log('✅ Schedule event synced successfully:', operation, event.id);
    this.setSyncStatus('synced');
  } catch (error) {
    console.error('❌ Error syncing schedule event:', error);
    this.setSyncStatus('error');
    throw error;
  }
}
```

### Step 3: Test the Complete Flow

After running the SQL:

1. **Refresh your app** (Ctrl+R)
2. **Go to Study Planner**
3. **Create a new event**:
   - Title: "Test Complete Fix"
   - Start time: Today, 4:00 PM
   - End time: Today, 6:00 PM
4. **Save it**
5. **Check if it persists** after refresh
6. **Wait 5 minutes**
7. **Check Google Calendar**

---

## 🔍 Debugging Steps

If it still doesn't work, check these:

### Check Browser Console
1. Open F12 → Console
2. Try creating event
3. Look for specific error messages

### Check Network Tab
1. F12 → Network
2. Try creating event
3. Look for failed requests to Supabase
4. Check request/response details

### Check Database
```sql
-- Check if event was created
SELECT * FROM schedule_events 
WHERE user_id = auth.uid()
ORDER BY created_at DESC 
LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'schedule_events';

-- Check sync queue
SELECT * FROM google_calendar_sync_queue 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🎯 Expected Results

After the fix:

✅ **Frontend Saving**: Events save and persist after refresh
✅ **Database Storage**: Events appear in `schedule_events` table
✅ **Sync Queue**: Events added to `google_calendar_sync_queue`
✅ **Google Calendar**: Events sync within 5 minutes
✅ **No Errors**: No 403 or constraint errors

---

## 📊 Verification Checklist

- [ ] SQL fix executed successfully
- [ ] Test event created via SQL
- [ ] Frontend can create events
- [ ] Events persist after refresh
- [ ] Events appear in database
- [ ] Events added to sync queue
- [ ] PM2 worker processes events
- [ ] Events appear in Google Calendar
- [ ] No console errors

---

## 🚀 Final Test

Create this test event in the frontend:

- **Title**: "End-to-End Test"
- **Description**: "Testing complete Google Calendar integration"
- **Start**: Today, 5:00 PM
- **End**: Today, 7:00 PM
- **Type**: Study

**Expected**:
1. ✅ Saves in frontend
2. ✅ Persists after refresh
3. ✅ Appears in database
4. ✅ Added to sync queue
5. ✅ Syncs to Google Calendar (within 5 minutes)
6. ✅ Shows as "📚 End-to-End Test" with 10-minute reminder

---

**Run the SQL fix above and test! Everything should work end-to-end! 🚀**