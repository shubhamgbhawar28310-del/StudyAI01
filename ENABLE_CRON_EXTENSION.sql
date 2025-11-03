-- =====================================================
-- ENABLE PG_CRON EXTENSION FOR GOOGLE CALENDAR SYNC
-- =====================================================

-- Step 1: Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Step 3: Now create the cron job
-- Replace YOUR-PROJECT-REF and YOUR-ANON-KEY with your actual values
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer YOUR-ANON-KEY"}'::jsonb
  );
  $$
);

-- Step 4: Verify the cron job was created
SELECT * FROM cron.job;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Find YOUR-PROJECT-REF:
--    - Go to Supabase Dashboard → Project Settings → API
--    - Look for "Project URL": https://YOUR-PROJECT-REF.supabase.co
--
-- 2. Find YOUR-ANON-KEY:
--    - Go to Supabase Dashboard → Project Settings → API
--    - Copy the "anon" / "public" key
--
-- 3. The cron job runs every 5 minutes (*/5 * * * *)
--
-- 4. To delete the cron job later:
--    SELECT cron.unschedule('google-calendar-sync');
-- =====================================================
