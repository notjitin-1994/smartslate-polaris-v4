-- Rollback for API Cost Tracking System Migration

-- Drop views first
DROP VIEW IF EXISTS public.user_costs_overview;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_user_cost_details(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.update_cost_summaries(UUID, DATE);
DROP FUNCTION IF EXISTS public.log_api_usage(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, JSONB, JSONB, TEXT, TEXT, INTEGER);

-- Drop policies
DROP POLICY IF EXISTS "Admins can view all cost summaries" ON public.user_cost_summaries;
DROP POLICY IF EXISTS "Users can view own cost summaries" ON public.user_cost_summaries;
DROP POLICY IF EXISTS "Only admins can modify model pricing" ON public.api_model_pricing;
DROP POLICY IF EXISTS "Everyone can view model pricing" ON public.api_model_pricing;
DROP POLICY IF EXISTS "Admins can view all api usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Users can view own api usage logs" ON public.api_usage_logs;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_user_cost_summaries_user_period;
DROP INDEX IF EXISTS public.idx_user_cost_summaries_period;
DROP INDEX IF EXISTS public.idx_user_cost_summaries_user_id;
DROP INDEX IF EXISTS public.idx_api_usage_logs_provider_model;
DROP INDEX IF EXISTS public.idx_api_usage_logs_user_month;
DROP INDEX IF EXISTS public.idx_api_usage_logs_month_year;
DROP INDEX IF EXISTS public.idx_api_usage_logs_created_at;
DROP INDEX IF EXISTS public.idx_api_usage_logs_blueprint_id;
DROP INDEX IF EXISTS public.idx_api_usage_logs_user_id;

-- Drop tables
DROP TABLE IF EXISTS public.user_cost_summaries;
DROP TABLE IF EXISTS public.api_model_pricing;
DROP TABLE IF EXISTS public.api_usage_logs;