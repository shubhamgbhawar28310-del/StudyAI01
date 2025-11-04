# 🚀 Quick Start Fix - 2 Steps

## The Problem
The Google Calendar sync trigger is causing duplicate key errors when creating events.

## The Solution (2 Simple Steps)

### Step 1: Disable Trigger (Do This Now!)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and run **`DISABLE_TRIGGER_TEMPORARILY.sql`**
3. Refresh your app (Ctrl+F5)
4. **Try creating an event** - it should work now! ✅

### Step 2: Re-enable Trigger (Do This Later)

After you've confirmed events are creating successfully:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and run **`ENABLE_TRIGGER_FIXED.sql`**
3. This re-enables Google Calendar sync with proper duplicate handling

## What This Does

### Step 1 (Disable):
- ✅ Removes the problematic trigger
- ✅ Cleans up duplicate entries in sync queue
- ✅ Lets you create events immediately
- ⚠️ Events won't sync to Google Calendar (temporarily)

### Step 2 (Re-enable):
- ✅ Re-enables the trigger with proper fix
- ✅ Uses `ON CONFLICT DO UPDATE` to handle duplicates
- ✅ Adds exception handling
- ✅ Events will sync to Google Calendar again

## Why This Works

The trigger was trying to INSERT into the sync queue, but entries already existed. The fixed version uses `ON CONFLICT DO UPDATE` which:
- If entry exists → UPDATE it
- If entry doesn't exist → INSERT it
- Never fails with duplicate error

## Testing

After Step 1:
1. Create a test event
2. Should work without errors ✅
3. Event appears in schedule ✅
4. No Google Calendar sync (that's expected)

After Step 2:
1. Create another test event
2. Should work without errors ✅
3. Event appears in schedule ✅
4. Event syncs to Google Calendar ✅

## Alternative: Keep Trigger Disabled

If you don't need Google Calendar sync, just run Step 1 and skip Step 2. Your events will work perfectly without the sync feature.

## Files

- **DISABLE_TRIGGER_TEMPORARILY.sql** - Run this first
- **ENABLE_TRIGGER_FIXED.sql** - Run this after testing
- **FINAL_WORKING_FIX.sql** - Complete fix (if you want to do it all at once)

---

**TL;DR**: Run `DISABLE_TRIGGER_TEMPORARILY.sql` now, create events, then run `ENABLE_TRIGGER_FIXED.sql` later to re-enable sync.
