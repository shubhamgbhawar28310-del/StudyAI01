-- Check which extensions are available and enabled
SELECT 
  e.extname,
  e.extversion,
  n.nspname as schema,
  'Enabled' as status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY e.extname;

-- Check if pg_net is available (even if not enabled)
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
WHERE name IN ('pg_net', 'pg_cron', 'http')
ORDER BY name;
