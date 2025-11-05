# Deploy Google Calendar Batch Sync Fix

## Problem
The Google Calendar sync button only syncs NEW events created after connecting Google Calendar. Existing events in the study planner remain unsynced.

## Solution
Created a new edge function `google-calendar-batch-sync` that queues all existing unsynced events, and updated the sync button to call it.

## Deployment Steps

### 1. Deploy the New Edge Function

```bash
# Deploy the batch-sync function
supabase functions deploy google-calendar-batch-sync

# Verify it's deployed
supabase functions list
```

### 2. Set Environment Variables (if not already set)

The batch-sync function needs these environment variables:

```bash
supabase secrets set GOOGLE_CLIENT_ID=your_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test the Fix

1. **Connect Google Calendar** (if not already connected)
   - Go to Settings → Notifications
   - Click "Connect Google Calendar"
   - Complete OAuth flow

2. **Create some test events** in the study planner BEFORE connecting (if testing fresh)

3. **Click "Sync to Calendar"** button
   - Should see: "Queued X events, processed Y events"
   - Check your Google Calendar - old events should now appear!

### 4. Verify in Database

Run this SQL to check sync status:

```sql
-- Check unsynced events
SELECT 
  id, 
  title, 
  synced_to_google, 
  google_event_id,
  created_at
FROM schedule_events
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Check sync queue
SELECT 
  event_type,
  operation,
  status,
  created_at
FROM google_calendar_sync_queue
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 20;
```

## What Changed

### 1. New Edge Function: `google-calendar-batch-sync`
- Fetches all unsynced schedule_events and tasks
- Adds them to the sync queue
- Prevents duplicates
- Triggers the worker to process

### 2. Updated: `google-calendar-auth`
- Now calls batch-sync automatically after OAuth connection
- Ensures existing events sync immediately after connecting

### 3. Updated: `GoogleCalendarSyncButton.tsx`
- Now calls batch-sync FIRST to queue unsynced events
- Then calls worker to process the queue
- Shows better feedback about queued vs processed events

### 4. Updated: `googleCalendarService.ts`
- Added `syncAllEvents()` method
- Added `getSyncStatus()` method for UI feedback

## How It Works Now

### Automatic Sync (New Events)
1. User creates event in study planner
2. Database trigger adds it to sync queue
3. Worker processes queue automatically (or on next manual sync)

### Manual Sync (Existing Events)
1. User clicks "Sync to Calendar" button
2. Batch-sync finds all unsynced events
3. Adds them to sync queue
4. Worker processes queue immediately
5. Events appear in Google Calendar

### After OAuth Connection
1. User completes OAuth
2. Tokens saved to database
3. Batch-sync automatically triggered
4. All existing events queued and synced

## Troubleshooting

### "Nothing to Sync" but events are missing
- Check if events have `synced_to_google = false` in database
- Check if `google_event_id` is null
- Run the SQL verification queries above

### Sync fails with "User settings not found"
- Ensure user has completed OAuth flow
- Check `user_settings` table has `google_calendar_token`

### Events queued but not processing
- Manually trigger worker: `supabase functions invoke google-calendar-worker`
- Check worker logs for errors
- Verify Google Calendar API credentials

### Duplicate events in Google Calendar
- The system prevents duplicates using `google_event_id`
- If duplicates exist, they were likely created before this fix
- Manually delete duplicates from Google Calendar

## Success Criteria

✅ Old events (created before OAuth) now sync when clicking "Sync to Calendar"
✅ New events (created after OAuth) auto-sync via triggers
✅ No duplicate events created
✅ Sync status shows accurate counts
✅ Toast notifications show queued + processed counts

## Next Steps

After deployment:
1. Test with your existing study planner data
2. Verify events appear in Google Calendar
3. Check that updates/deletes also sync properly
4. Monitor edge function logs for any errors
