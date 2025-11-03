# 📊 Google Calendar Integration - Flow Diagrams

## 🔐 OAuth Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS "CONNECT CALENDAR"                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  googleCalendarService.initiateOAuth()                           │
│  • Opens Google Sign-In popup                                    │
│  • Requests calendar + email permissions                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH SCREEN                           │
│  • User signs in with Google                                     │
│  • User grants permissions                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Google redirects to: /auth/google/callback?code=xxx             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  GoogleCalendarCallback.tsx                                      │
│  • Extracts authorization code                                   │
│  • Calls googleCalendarService.exchangeCodeForTokens()           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Edge Function: google-calendar-auth                    │
│  • Exchanges code for access_token + refresh_token               │
│  • Gets user email from Google                                   │
│  • Stores tokens in user_settings table (encrypted)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Callback page sends message to parent window                    │
│  • { type: 'google-calendar-auth', success: true, email: ... }   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  NotificationSettings.tsx receives message                       │
│  • Updates UI: ✅ Connected as user@gmail.com                    │
│  • Closes popup                                                  │
│  • Shows success toast                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Event Sync Flow (Create/Update)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER CREATES/UPDATES STUDY SESSION OR TASK                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database INSERT/UPDATE on schedule_events or tasks              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database Trigger Fires                                          │
│  • trigger_sync_schedule_event() or trigger_sync_task()          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Check if user has Google Calendar connected                     │
│  • Query user_settings.google_calendar_connected                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌───────────┐      ┌──────────┐
            │ Connected │      │    Not   │
            │           │      │ Connected│
            └─────┬─────┘      └──────────┘
                  │                   │
                  │                   ▼
                  │            (Skip sync)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Add to google_calendar_sync_queue                               │
│  • event_type: 'schedule_event' or 'task'                        │
│  • operation: 'create' or 'update'                               │
│  • event_data: JSON with event details                           │
│  • status: 'pending'                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Background Worker (Cron Job - Every 5 minutes)                  │
│  • Calls google-calendar-worker Edge Function                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  google-calendar-worker processes queue                          │
│  • Gets pending items from sync_queue                            │
│  • For each item:                                                │
│    1. Get user's access token                                    │
│    2. Check if token expired → refresh if needed                 │
│    3. Call Google Calendar API                                   │
│    4. Update database with google_event_id                       │
│    5. Mark as 'completed' in queue                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Google Calendar API                                             │
│  • POST /calendars/primary/events (create)                       │
│  • PATCH /calendars/primary/events/{id} (update)                 │
│  • Returns event with google_event_id                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Update StudyAI Database                                         │
│  • Set google_event_id on schedule_events or tasks               │
│  • Set synced_to_google = true                                   │
│  • Set last_synced_at = NOW()                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ EVENT SYNCED TO GOOGLE CALENDAR                              │
│  • Appears in user's Google Calendar                             │
│  • Has 10-minute reminder                                        │
│  • Has 📚 or ✅ emoji in title                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗑️ Event Deletion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER DELETES STUDY SESSION OR TASK                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database DELETE on schedule_events or tasks                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  AFTER DELETE Trigger Fires                                      │
│  • trigger_sync_schedule_event_delete()                          │
│  • trigger_sync_task_delete()                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Check if event was synced to Google                             │
│  • OLD.google_event_id IS NOT NULL?                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌───────────┐      ┌──────────┐
            │  Was      │      │   Not    │
            │  Synced   │      │  Synced  │
            └─────┬─────┘      └──────────┘
                  │                   │
                  │                   ▼
                  │            (Skip deletion)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Add to google_calendar_sync_queue                               │
│  • operation: 'delete'                                           │
│  • event_data: { google_event_id: 'xxx' }                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Background Worker processes deletion                            │
│  • Calls DELETE /calendars/primary/events/{id}                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ EVENT REMOVED FROM GOOGLE CALENDAR                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Background Worker attempts to sync event                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Get user's access token from database                           │
│  • google_calendar_token                                         │
│  • google_calendar_token_expires_at                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Check if token is expired                                       │
│  • expires_at < NOW() ?                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌───────────┐      ┌──────────┐
            │  Expired  │      │  Valid   │
            └─────┬─────┘      └────┬─────┘
                  │                 │
                  │                 ▼
                  │          (Use existing token)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Call Google Token Refresh API                                   │
│  • POST https://oauth2.googleapis.com/token                      │
│  • Body: { refresh_token, grant_type: 'refresh_token' }          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Receive new access token                                        │
│  • New access_token                                              │
│  • New expires_in (usually 3600 seconds)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Update database                                                 │
│  • google_calendar_token = new_token                             │
│  • google_calendar_token_expires_at = NOW() + expires_in         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Continue with sync using new token                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Disconnect Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER CLICKS "DISCONNECT CALENDAR"                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Confirmation Dialog                                             │
│  "Are you sure you want to disconnect?"                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌───────────┐      ┌──────────┐
            │  Confirm  │      │  Cancel  │
            └─────┬─────┘      └────┬─────┘
                  │                 │
                  │                 ▼
                  │            (Do nothing)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  googleCalendarService.disconnect()                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Revoke Google access token (optional)                           │
│  • POST https://oauth2.googleapis.com/revoke                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Clear tokens from database                                      │
│  • google_calendar_connected = false                             │
│  • google_calendar_email = NULL                                  │
│  • google_calendar_token = NULL                                  │
│  • google_calendar_refresh_token = NULL                          │
│  • google_calendar_token_expires_at = NULL                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Update UI                                                       │
│  • Show "Not connected"                                          │
│  • Change button to "Connect Calendar"                           │
│  • Show success toast                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ DISCONNECTED                                                 │
│  • Future events won't sync                                      │
│  • Existing Google Calendar events remain                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        user_settings                             │
├─────────────────────────────────────────────────────────────────┤
│ user_id (PK)                                                     │
│ google_calendar_connected (BOOLEAN)                              │
│ google_calendar_email (TEXT)                                     │
│ google_calendar_token (TEXT) [encrypted]                         │
│ google_calendar_refresh_token (TEXT) [encrypted]                 │
│ google_calendar_token_expires_at (TIMESTAMPTZ)                   │
│ google_calendar_last_sync (TIMESTAMPTZ)                          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ 1:N
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────┐
│  schedule_events     │              │       tasks          │
├──────────────────────┤              ├──────────────────────┤
│ id (PK)              │              │ id (PK)              │
│ user_id (FK)         │              │ user_id (FK)         │
│ title                │              │ title                │
│ start_time           │              │ deadline             │
│ end_time             │              │ description          │
│ description          │              │ status               │
│ google_event_id      │              │ google_event_id      │
│ synced_to_google     │              │ synced_to_google     │
│ last_synced_at       │              │ last_synced_at       │
└──────────────────────┘              └──────────────────────┘
        │                                         │
        │                                         │
        └────────────────────┬────────────────────┘
                             │
                             │ Referenced by
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              google_calendar_sync_queue                          │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ user_id (FK)                                                     │
│ event_type (schedule_event | task)                              │
│ event_id (FK to schedule_events or tasks)                       │
│ operation (create | update | delete)                            │
│ event_data (JSONB)                                               │
│ status (pending | processing | completed | failed)               │
│ error_message (TEXT)                                             │
│ retry_count (INTEGER)                                            │
│ created_at (TIMESTAMPTZ)                                         │
│ processed_at (TIMESTAMPTZ)                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Components

### Frontend
- **googleCalendarService.ts** - OAuth flow, API calls
- **GoogleCalendarCallback.tsx** - OAuth redirect handler
- **NotificationSettings.tsx** - UI for connect/disconnect

### Backend (Supabase)
- **google-calendar-auth** - Token exchange
- **google-calendar-sync** - Manual sync operations
- **google-calendar-worker** - Background queue processor

### Database
- **Triggers** - Auto-add events to sync queue
- **Sync Queue** - Reliable background processing
- **Token Storage** - Encrypted token management

---

**This visual guide shows exactly how everything works together! 🎨**
