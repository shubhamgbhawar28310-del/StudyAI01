# Complete Fix for Google Calendar Retroactive Sync

## Quick Fix (Do This First)

### Option A: Using SQL (Fastest)

1. **Open Supabase SQL Editor**

2. **Run this SQL:**
```sql
-- Copy and paste from MANUAL_QUEUE_ALL_EVENTS.sql
```

3. **Then invoke the worker:**
   - Go to Supabase Dashboard
   - Edge Functions → `google-calendar-worker`
   - Click "Invoke"

4. **Check Google Calendar** - events should appear!

### Option B: Using the Sync Button

1. **Deploy the edge function:**
```bash
supabase functions deploy google-calendar-batch-sync
```

2. **Click "Sync to Calendar"** in Settings

3. **Check browser console** for logs

## Why It Wasn't Working

The sync system has 3 parts:
1. **Database Triggers** - Auto-queue NEW events
2. **Batch Sync Function** - Queue OLD events
3. **Worker Function** - Process the queue

Your issue: The batch-sync function wasn't deployed, so old events never got queued.

## Permanent Fix

Deploy all edge functions:
```bash
cd supabase/functions
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync  
supabase functions deploy google-calendar-worker
supabase functions deploy google-calendar-batch-sync
```

## Verify It's Working

### Test 1: Check Database
```sql
-- Should show columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'schedule_events'
AND column_name IN ('synced_to_google', 'google_event_id');
```

### Test 2: Check Functions
```bash
supabase functions list
# Should show all 4 functions
```

### Test 3: Check Sync
1. Create a test event in study planner
2. Click "Sync to Calendar"
3. Check Google Calendar

## Troubleshooting

### "Function not found" error
```bash
supabase functions deploy google-calendar-batch-sync
```

### "Column does not exist" error
```sql
-- Run ADD_SYNC_COLUMNS.sql
```

### Events queued but not syncing
```bash
# Manually trigger worker
supabase functions invoke google-calendar-worker
```

### Still not working?
1. Check Supabase Edge Function logs
2. Check browser console (F12)
3. Run DEBUG_SYNC_ISSUE.sql
4. Verify Google OAuth is connected

## Files You Need

- ✅ `supabase/functions/google-calendar-batch-sync/index.ts` (created)
- ✅ `src/components/features/GoogleCalendarSyncButton.tsx` (updated)
- ✅ `supabase/functions/google-calendar-auth/index.ts` (updated)
- ✅ `ADD_SYNC_COLUMNS.sql` (run if columns missing)
- ✅ `MANUAL_QUEUE_ALL_EVENTS.sql` (quick fix)

## Success Criteria

✅ Old events sync when clicking "Sync to Calendar"
✅ New events auto-sync via triggers
✅ No duplicate events
✅ Toast shows "Queued X events, processed Y events"
✅ Events appear in Google Calendar with 📚 emoji
