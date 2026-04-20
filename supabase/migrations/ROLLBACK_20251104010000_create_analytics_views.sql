-- Rollback Migration: Drop analytics views and functions
-- Description: Removes all analytics aggregation views and functions
-- Date: 2025-11-04

-- Drop functions
DROP FUNCTION IF EXISTS get_platform_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_user_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Drop views
DROP VIEW IF EXISTS public.user_engagement_metrics;
DROP VIEW IF EXISTS public.blueprint_completion_rate;
DROP VIEW IF EXISTS public.blueprint_analytics_daily;
DROP VIEW IF EXISTS public.session_browser_distribution;
DROP VIEW IF EXISTS public.session_device_distribution;
DROP VIEW IF EXISTS public.session_analytics_daily;
DROP VIEW IF EXISTS public.user_activity_monthly;
DROP VIEW IF EXISTS public.user_activity_weekly;
DROP VIEW IF EXISTS public.user_activity_daily;
