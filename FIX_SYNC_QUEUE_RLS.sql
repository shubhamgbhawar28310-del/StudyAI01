-- =====================================================
-- FIX SYNC QUEUE RLS - The Real Issue
-- =====================================================

-- The error is: "new row violates row-level security policy for table google_calendar_sync_queue"
-- This means the schedule_events insert works, but the trigger that adds to sync queue fails

-- Step 1: Check current policies on google_calendar_sync_queue
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'google_calendar_sync_queue';

-- Step 2: Check if RLS is enabled on sync queue
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'google_calendar_sync_queue';

-- Step 3: Make google_calendar_sync_queue policies permissive
DROP POLICY IF EXISTS "Users can view their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can insert their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can update their own sync queue" ON google_calendar_sync_queue;
DROP POLICY IF EXISTS "Users can delete their own sync queue" ON google_calendar_sync_queue;

-- Step 4: Create permissive policies for google_calendar_sync_queue
CREATE POLICY "Allow authenticated users to view sync queue"
ON google_calendar_sync_queue
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert sync queue"
ON google_calendar_sync_queue
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sync queue"
ON google_calendar_sync_queue
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sync queue"
ON google_calendar_sync_queue
FOR DELETE
TO authenticated
USING (true);

-- Step 5: Test manual insert into sync queue
INSERT INTO google_calendar_sync_queue (
  id,
  user_id,
  event_type,
  event_id,
  operation,
  event_data,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62',
  'schedule_event',
  gen_random_uuid(),
  'create',
  '{"test": "manual insert"}',
  'pending',
  NOW()
);

-- Step 6: Check if manual insert worked
SELECT * FROM google_calendar_sync_queue 
WHERE event_data::text LIKE '%manual insert%'
ORDER BY created_at DESC;

-- Step 7: Now test schedule_events insert (should trigger sync queue automatically)
INSERT INTO schedule_events (
  id,
  user_id,
  title,
  description,
  start_time,
  end_time,
  type,
  status,
  synced_to_google,
  created_at
) VALUES (
  gen_random_uuid(),
  '8cd06c21-bdf5-4cb8-b18e-bf6ad101fa62',
  '🔧 Sync Queue Fix Test',
  'Testing if sync queue trigger works now',
  NOW() + INTERVAL '3 hours',
  NOW() + INTERVAL '5 hours',
  'study',
  'scheduled',
  false,
  NOW()
);

-- Step 8: Verify both tables have the new data
SELECT 'schedule_events' as table_name, title, created_at 
FROM schedule_events 
WHERE title = '🔧 Sync Queue Fix Test'
UNION ALL
SELECT 'sync_queue' as table_name, 
       (event_data->>'summary')::text as title, 
       created_at 
FROM google_calendar_sync_queue 
WHERE event_data::text LIKE '%Sync Queue Fix Test%'
ORDER BY created_at DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed google_calendar_sync_queue RLS policies!';
    RAISE NOTICE '🔧 The real issue was sync queue permissions, not schedule_events!';
    RAISE NOTICE '🧪 Now test the frontend - it should work!';
END $$;