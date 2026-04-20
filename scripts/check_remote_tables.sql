-- Run this query in Supabase SQL Editor to see what tables exist
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this

SELECT
    schemaname as schema,
    tablename as table_name,
    tableowner as owner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- This will show you exactly what tables are in your database
-- Expected result: Only 3 tables
--   1. blueprint_generator
--   2. role_audit_log
--   3. user_profiles
