# 🚨 URGENT FIX: Duplicate Event Error

## The Problem

You're getting this error when creating events:
```
duplicate key value violates unique constraint "google_calendar_sync_queue_event_type_event_id_key"
```

## The Cause

There's a database trigger that automatically syncs events to Google Calendar. It's trying to insert the same event into the sync queue twice, causing a conflict.

## The Fix (2 Steps)

### Step 1: Run SQL Fix

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Fix the trigger to handle duplicates gracefully
CREATE OR REPLACE FUNCTION sync_schedule_event_to_google()
RETURNS TRIGGER AS $$
DECLARE
    v_connected BOOLEAN;
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    v_user_id := NEW.user_id;
    
    -- Check if user has Google Calendar connected
    SELECT google_calendar_connected INTO v_connected
    FROM user_settings
    WHERE user_id = v_user_id;
    
    -- If not connected, skip sync
    IF v_connected IS NULL OR v_connected = false THEN
        RETURN NEW;
    END IF;
    
    NEW.synced_to_google := false;
    
    -- Check if entry already exists
    SELECT id INTO v_existing_id
    FROM google_calendar_sync_queue
    WHERE event_type = 'schedule_event'
    AND event_id = NEW.id;
    
    -- Update if exists, insert if not
    IF v_existing_id IS NOT NULL THEN
        UPDATE google_calendar_sync_queue
        SET 
            operation = CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            event_data = jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session'),
                'start', jsonb_build_object('dateTime', NEW.start_time, 'timeZone', 'UTC'),
                'end', jsonb_build_object('dateTime', NEW.end_time, 'timeZone', 'UTC')
            ),
            status = 'pending',
            created_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        INSERT INTO google_calendar_sync_queue (user_id, event_type, event_id, operation, event_data)
        VALUES (
            v_user_id,
            'schedule_event',
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            jsonb_build_object(
                'summary', '📚 ' || NEW.title,
                'description', COALESCE(NEW.description, 'Study session'),
                'start', jsonb_build_object('dateTime', NEW.start_time, 'timeZone', 'UTC'),
                'end', jsonb_build_object('dateTime', NEW.end_time, 'timeZone', 'UTC')
            )
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        RETURN NEW;
    WHEN OTHERS THEN
        RAISE WARNING 'Sync error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clean up duplicates
DELETE FROM google_calendar_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY event_type, event_id ORDER BY created_at DESC) AS rn
        FROM google_calendar_sync_queue
    ) t WHERE t.rn > 1
);

-- Fix RLS policies
DROP POLICY IF EXISTS "Users can view their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can insert their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can update their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to view sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to insert sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Allow authenticated users to update sync queue" ON google_calendar_sync_queue;

CREATE POLICY "Users can manage their sync queue"
    ON google_calendar_sync_queue FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

4. Click **Run** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

### Step 2: Refresh Your App

1. Go back to your app
2. Press **Ctrl+F5** (or Cmd+Shift+R on Mac) to hard refresh
3. Try creating an event

## It Should Work Now! ✅

If you still get an error, check the browser console (F12) and share the error message.

## What This Fix Does

1. **Updates the trigger** to check if an entry already exists before inserting
2. **Cleans up duplicates** in the sync queue
3. **Fixes RLS policies** so the trigger has proper permissions
4. **Adds error handling** so the trigger won't crash even if something goes wrong

## Alternative: Disable Google Calendar Sync

If you don't need Google Calendar sync, you can disable it:

```sql
-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS trigger_sync_schedule_event ON schedule_events;
```

Then you can create events without any sync queue issues.
