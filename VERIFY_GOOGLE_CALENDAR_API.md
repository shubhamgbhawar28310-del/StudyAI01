# Verify Google Calendar API - Events Not Showing

## Problem
Database shows events are synced with `google_event_id`, but they don't appear in Google Calendar.

## Possible Causes
1. Events were created but then deleted
2. Worker is returning fake IDs without actually calling Google API
3. Events are in a different calendar (not primary)
4. Google Calendar API permissions issue

## Steps to Debug

### 1. Check Edge Function Logs
Go to Supabase Dashboard → Edge Functions → google-calendar-worker → Logs

Look for:
- Actual API calls to Google
- Response from Google Calendar API
- Any errors during sync

### 2. Test Direct API Call
Let's manually verify one event exists in Google Calendar:

```bash
# Replace with your access token from user_settings table
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events/0q8i4phpjba7c8bvo4e8gmq028" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

If this returns 404, the event doesn't exist in Google Calendar.

### 3. Check Worker Function Code
The worker might be:
- Marking events as completed without actually calling Google API
- Storing fake event IDs
- Silently failing but not logging errors

### 4. Get Your Access Token
Run this SQL to get your current access token:

```sql
SELECT 
  google_calendar_token,
  google_calendar_token_expires_at,
  google_calendar_token_expires_at < NOW() as is_expired
FROM user_settings
WHERE user_id = '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4';
```

### 5. Manual Test - Create Event via API
Let's manually create a test event to verify the API works:

```bash
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "TEST from API",
    "start": {
      "dateTime": "2025-11-10T10:00:00Z",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2025-11-10T11:00:00Z",
      "timeZone": "UTC"
    }
  }'
```

If this works and shows up in Google Calendar, then the issue is with the worker function.

## Next Steps

1. **Check Supabase Edge Function Logs** - This is the most important step
2. **Verify the worker is actually calling Google API** - Not just marking as complete
3. **Test with a fresh event** - Create a new event in your app and watch it sync

## Quick Fix to Test

Let's force re-sync one event and watch what happens:

```sql
-- Delete one event from queue
DELETE FROM google_calendar_sync_queue
WHERE event_id = 'abf32592-a0c9-4480-9140-19771bb25fd3';

-- Reset sync status
UPDATE schedule_events
SET synced_to_google = false,
    google_event_id = NULL
WHERE id = 'abf32592-a0c9-4480-9140-19771bb25fd3';

-- Re-queue it
INSERT INTO google_calendar_sync_queue (
  user_id, event_type, event_id, operation, event_data, status
) VALUES (
  '54a35c8f-663f-4a0b-a6cb-1fa65177a6b4',
  'schedule_event',
  'abf32592-a0c9-4480-9140-19771bb25fd3',
  'create',
  jsonb_build_object(
    'summary', '📚 TEST SYNC',
    'start', jsonb_build_object('dateTime', '2025-11-10T10:00:00Z', 'timeZone', 'UTC'),
    'end', jsonb_build_object('dateTime', '2025-11-10T11:00:00Z', 'timeZone', 'UTC')
  ),
  'pending'
);

-- Now invoke worker and watch logs
```

Then:
1. Invoke the worker
2. Check Supabase logs
3. Check if "TEST SYNC" appears in Google Calendar
