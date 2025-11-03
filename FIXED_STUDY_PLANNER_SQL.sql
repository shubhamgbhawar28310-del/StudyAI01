-- =====================================================
-- FIXED STUDY PLANNER DATABASE SETUP
-- =====================================================

-- Step 1: Check current RLS policies (fixed query)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'schedule_events';

-- Step 2: Drop all existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can view their own schedule events" ON schedule_events;
DROP POLICY IF EXISTS "Users can insert their own schedule events" ON schedule_events;
DROP POLICY IF EXISTS "Users can update their own schedule events" ON schedule_events;
DROP POLICY IF EXISTS "Users can delete their own schedule events" ON schedule_events;

-- Step 3: Create proper RLS policies
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

-- Step 4: Check what status values are allowed (fixed query)
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%status%' 
AND constraint_name LIKE '%schedule_events%';

-- Step 5: Drop restrictive status constraint
ALTER TABLE schedule_events DROP CONSTRAINT IF EXISTS schedule_events_status_check;

-- Step 6: Add a more flexible status constraint
ALTER TABLE schedule_events 
ADD CONSTRAINT schedule_events_status_check 
CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'upcoming', 'missed'));

-- Step 7: Add helpful defaults
ALTER TABLE schedule_events 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE schedule_events 
ALTER COLUMN status SET DEFAULT 'scheduled';

ALTER TABLE schedule_events 
ALTER COLUMN type SET DEFAULT 'study';

ALTER TABLE schedule_events 
ALTER COLUMN missed_count SET DEFAULT 0;

ALTER TABLE schedule_events 
ALTER COLUMN synced_to_google SET DEFAULT false;

-- Step 8: Test insert (this should work now)
INSERT INTO schedule_events (
  user_id,
  title,
  description,
  start_time,
  end_time
) VALUES (
  '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62',
  'Test Frontend Fix',
  'Testing if frontend can save now',
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '4 hours'
);

-- Step 9: Verify it was created
SELECT 
  id,
  user_id,
  title,
  status,
  synced_to_google
FROM schedule_events 
WHERE title = 'Test Frontend Fix';

-- Step 10: Check sync queue
SELECT * FROM google_calendar_sync_queue 
WHERE event_type = 'schedule_event'
ORDER BY created_at DESC 
LIMIT 5;

-- Step 11: Verify policies are working
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'schedule_events';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Study Planner database fixed!';
    RAISE NOTICE '✅ RLS policies updated';
    RAISE NOTICE '✅ Status constraint relaxed';
    RAISE NOTICE '✅ Default values added';
    RAISE NOTICE '✅ Test event created and should sync to Google Calendar';
    RAISE NOTICE 'Frontend should work now!';
END $$;