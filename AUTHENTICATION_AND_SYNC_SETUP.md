# Authentication and Data Sync Setup Guide

## Overview

StudyAI now features complete user authentication and persistent data synchronization using Supabase. This ensures that:

- ✅ User data is **never lost** on refresh or logout
- ✅ Data is **automatically synced** to the cloud in real-time
- ✅ Each user has their **own isolated dataset**
- ✅ **Offline persistence** using localStorage as backup
- ✅ **Real-time sync indicator** shows save status

## Features Implemented

### 1. User Authentication
- **Email/Password Authentication**: Secure login with Supabase Auth
- **Google OAuth**: One-click sign-in with Google
- **Session Persistence**: Users stay logged in across browser sessions
- **Protected Routes**: Dashboard requires authentication

### 2. Data Synchronization
All user data is automatically synced to Supabase:
- 📝 **Tasks**: All tasks with full metadata
- 📚 **Materials**: Study materials and documents
- 🎴 **Flashcards**: Individual flashcards and decks
- ⏱️ **Pomodoro Sessions**: Study session history
- 📅 **Schedule Events**: Calendar events
- 📊 **User Stats**: Progress tracking and achievements

### 3. Real-time Features
- **Auto-sync**: Changes are synced immediately to the database
- **Sync Status Indicator**: Visual feedback (top-right corner)
  - 🔵 "Syncing..." - Data is being saved
  - ✅ "All changes saved" - Data successfully synced
  - ❌ "Sync error" - Connection issue
- **Offline Support**: localStorage backup when offline

## Setup Instructions

### Step 1: Run Database Migrations

You need to run the SQL migrations to create the required database tables in Supabase.

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/create_user_data_tables.sql`
5. Click **Run** to execute the migration
6. Verify tables were created by going to **Table Editor**

#### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Step 2: Verify Environment Variables

Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Step 3: Enable Google OAuth (Optional)

If you want to enable Google sign-in:

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (for development)

### Step 4: Test the Implementation

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Create a new account**:
   - Go to `/signup`
   - Register with email/password or Google
   - You'll be redirected to the dashboard

3. **Add some data**:
   - Create tasks, materials, flashcards
   - Watch the sync indicator in the top-right corner

4. **Test persistence**:
   - Refresh the page → Data should remain
   - Logout and login again → Data should be restored
   - Open in a different browser → Login to see your data

## Database Schema

### Tables Created

1. **tasks** - User tasks with priorities, due dates, and progress
2. **materials** - Study materials and uploaded documents
3. **flashcards** - Individual flashcards for spaced repetition
4. **flashcard_decks** - Organized flashcard collections
5. **pomodoro_sessions** - Pomodoro timer session history
6. **schedule_events** - Calendar events and study schedule
7. **user_stats** - User progress, XP, level, and achievements
8. **user_preferences** - User settings and preferences

### Row Level Security (RLS)

All tables have RLS policies that ensure:
- Users can only see their own data
- Users can only modify their own data
- Data is isolated by `user_id`

## How It Works

### Data Flow

```
User Action → Local State Update → UI Update → Supabase Sync
                                              ↓
                                    localStorage Backup
```

### On Login
1. User authenticates with Supabase
2. `AuthContext` receives user session
3. `StudyPlannerContext` fetches all user data from Supabase
4. Data is loaded into local state
5. User sees their dashboard with all data

### On Data Change
1. User creates/updates/deletes data
2. Local state updates immediately (optimistic UI)
3. Change syncs to Supabase in background
4. Sync indicator shows status
5. localStorage backup is updated

### On Logout
1. User clicks logout
2. Session is cleared from Supabase
3. Local state is reset to initial empty state
4. User is redirected to landing page
5. Cloud data remains safe in Supabase

### On Refresh
1. Page reloads
2. `AuthContext` checks for existing session
3. If session exists, user data is fetched from Supabase
4. Data is restored to local state
5. User continues where they left off

## Troubleshooting

### Data Not Syncing

**Check:**
1. Supabase credentials in `.env` are correct
2. Database migrations have been run
3. User is logged in (check browser console)
4. Network connection is active
5. Check browser console for errors

**Fix:**
```bash
# Verify environment variables
cat .env

# Check Supabase connection
# Open browser console and run:
console.log(import.meta.env.VITE_SUPABASE_URL)
```

### "Sync Error" Indicator

**Possible causes:**
- Network connection lost
- Supabase project is paused (free tier)
- RLS policies blocking access
- Invalid session token

**Fix:**
1. Check internet connection
2. Verify Supabase project is active
3. Try logging out and back in
4. Check browser console for specific errors

### Data Not Persisting After Refresh

**Check:**
1. Migrations were run successfully
2. User is actually logged in
3. Check Network tab for failed API calls
4. Verify RLS policies are correct

**Fix:**
```sql
-- Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Check if user_id matches
SELECT user_id FROM tasks LIMIT 1;
```

### Login Redirect Loop

**Fix:**
- Clear browser cache and cookies
- Check `ProtectedRoute` and `PublicRoute` components
- Verify auth state is being set correctly

## Advanced Configuration

### Offline Mode

The app automatically falls back to localStorage when offline:

```typescript
// In StudyPlannerContext.tsx
try {
  await dataSyncService.syncTask(task, user.id, 'insert')
} catch (error) {
  // Fails silently, data is in localStorage
  console.error('Sync failed, using local storage')
}
```

### Real-time Subscriptions (Future Enhancement)

To enable real-time updates across devices, uncomment the subscription code in `StudyPlannerContext.tsx`:

```typescript
// Subscribe to real-time changes
useEffect(() => {
  if (!user) return
  
  const subscription = dataSyncService.subscribeToTasks(
    user.id,
    (payload) => {
      // Handle real-time updates
      console.log('Real-time update:', payload)
    }
  )
  
  return () => subscription.unsubscribe()
}, [user])
```

### Custom Sync Intervals

To reduce API calls, you can implement debounced syncing:

```typescript
import { debounce } from 'lodash'

const debouncedSync = debounce((task, userId) => {
  dataSyncService.syncTask(task, userId, 'update')
}, 1000) // Wait 1 second after last change
```

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use RLS policies** - Already implemented
3. **Validate user input** - Implement on backend
4. **Use HTTPS in production** - Configure on deployment
5. **Rotate API keys regularly** - Supabase dashboard

## Migration from localStorage

If you have existing data in localStorage:

1. The app will automatically use localStorage as fallback
2. On first login, local data will be preserved
3. Gradually, Supabase will become the source of truth
4. You can manually migrate by:
   - Logging in
   - Data will sync to Supabase
   - Verify in Supabase dashboard
   - Clear localStorage if needed

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase dashboard for data
3. Review this documentation
4. Check Supabase logs in dashboard

## Next Steps

- ✅ Authentication working
- ✅ Data sync implemented
- ✅ Sync indicator added
- 🔄 Real-time subscriptions (optional)
- 🔄 Conflict resolution (optional)
- 🔄 Data export/import (optional)

---

**Last Updated**: January 2025
**Version**: 1.0.0
