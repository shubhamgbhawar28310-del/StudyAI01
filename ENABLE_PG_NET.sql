-- =====================================================
-- ENABLE PG_NET EXTENSION FOR HTTP REQUESTS
-- =====================================================

-- Step 1: Enable the pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Step 3: Grant permissions (if needed)
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres;

-- Step 4: Test the extension
SELECT net.http_get('https://httpbin.org/get');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ pg_net extension enabled!';
    RAISE NOTICE 'The cron job should now work correctly.';
    RAISE NOTICE 'Wait 5 minutes and check cron.job_run_details for successful runs.';
END $$;
