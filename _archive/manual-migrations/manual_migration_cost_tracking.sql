-- ==============================================================
-- MANUAL MIGRATION SCRIPT FOR COST TRACKING
-- ==============================================================
-- Run this script in your Supabase SQL Editor (Dashboard)
-- This will create the cost tracking tables and backfill data
-- ==============================================================

-- Step 1: Run the main cost tracking migration
-- Copy and paste the contents of: supabase/migrations/20251109000000_create_api_cost_tracking.sql

-- Step 2: Run the backfill migration
-- Copy and paste the contents of: supabase/migrations/20251109120000_backfill_api_costs.sql

-- Step 3: Run the increment function fix
-- Copy and paste the contents of: supabase/migrations/20251109112000_fix_increment_function_table_alias.sql

-- ==============================================================
-- VERIFICATION QUERIES
-- ==============================================================

-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('api_usage_logs', 'api_model_pricing', 'user_cost_summaries')
ORDER BY table_name;

-- Check if view was created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'user_costs_overview';

-- Check backfilled data count
SELECT
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE request_metadata->>'backfilled' = 'true') as backfilled_logs,
  COUNT(*) FILTER (WHERE request_metadata->>'backfilled' IS NULL OR request_metadata->>'backfilled' = 'false') as realtime_logs
FROM public.api_usage_logs;

-- Check user costs overview
SELECT * FROM public.user_costs_overview
ORDER BY this_month_cost_cents DESC
LIMIT 10;

-- Check total blueprints that should have been backfilled
SELECT
  COUNT(*) as total_blueprints,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_blueprints,
  COUNT(*) FILTER (WHERE dynamic_questions IS NOT NULL AND dynamic_questions::text != '[]') as has_questions
FROM public.blueprint_generator;
