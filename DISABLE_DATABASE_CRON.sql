-- Disable the database cron job since we're using Node.js worker instead
SELECT cron.unschedule('google-calendar-sync');

-- Verify it's removed
SELECT * FROM cron.job WHERE jobname = 'google-calendar-sync';
-- Should return no rows

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database cron job disabled!';
    RAISE NOTICE 'Now using Node.js sync worker instead.';
    RAISE NOTICE 'Run: node sync-worker.js';
END $$;
