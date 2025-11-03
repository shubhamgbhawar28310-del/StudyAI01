-- =====================================================
-- FIX NET SCHEMA ACCESS FOR CRON JOB
-- =====================================================

-- Step 1: Check current search path
SHOW search_path;

-- Step 2: Check if net schema exists
SELECT nspname FROM pg_namespace WHERE nspname = 'net';

-- Step 3: Grant permissions on net schema
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres;

-- Step 4: Set search path to include net schema
ALTER DATABASE postgres SET search_path TO public, net, extensions;

-- Step 5: For the current session
SET search_path TO public, net, extensions;

-- Step 6: Delete the old cron job
SELECT cron.unschedule('google-calendar-sync');

-- Step 7: Recreate the cron job with explicit schema reference
SELECT cron.schedule(
  'google-calendar-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://crdqpioymuvnzhtgrenj.supabase.co/functions/v1/google-calendar-worker',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZHFwaW95bXV2bnpodGdyZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4Mzc2NjQsImV4cCI6MjA3MzQxMzY2NH0.rv55zUVAkCCsZG0gzvOGHL3R8KzHpymaORrx56OnEC0"}'::jsonb
  );
  $$
);

-- Step 8: Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'google-calendar-sync';

-- Step 9: Test net.http_post directly
SELECT net.http_post(
  url := 'https://httpbin.org/post',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{"test": "data"}'::jsonb
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Net schema permissions granted!';
    RAISE NOTICE '✅ Cron job recreated!';
    RAISE NOTICE 'Wait 5 minutes and check cron.job_run_details for successful runs.';
END $$;
