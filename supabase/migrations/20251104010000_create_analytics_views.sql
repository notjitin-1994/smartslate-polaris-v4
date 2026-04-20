-- Migration: Create analytics views and aggregation functions
-- Description: Provides pre-aggregated views for user metrics, session analytics, and blueprint statistics
-- Date: 2025-11-04

-- ============================================================================
-- USER ACTIVITY ANALYTICS VIEW
-- ============================================================================

-- Daily user activity summary
CREATE OR REPLACE VIEW public.user_activity_daily AS
SELECT
    user_id,
    DATE(created_at) as activity_date,
    COUNT(*) as total_activities,
    COUNT(DISTINCT action_type) as unique_action_types,
    COUNT(*) FILTER (WHERE action_type LIKE 'blueprint_%') as blueprint_activities,
    COUNT(*) FILTER (WHERE action_type LIKE 'user_%') as user_management_activities,
    MIN(created_at) as first_activity_at,
    MAX(created_at) as last_activity_at
FROM public.activity_logs
GROUP BY user_id, DATE(created_at);

-- Weekly user activity summary
CREATE OR REPLACE VIEW public.user_activity_weekly AS
SELECT
    user_id,
    DATE_TRUNC('week', created_at) as week_start,
    COUNT(*) as total_activities,
    COUNT(DISTINCT action_type) as unique_action_types,
    COUNT(*) FILTER (WHERE action_type LIKE 'blueprint_%') as blueprint_activities,
    COUNT(*) FILTER (WHERE action_type LIKE 'user_%') as user_management_activities
FROM public.activity_logs
GROUP BY user_id, DATE_TRUNC('week', created_at);

-- Monthly user activity summary
CREATE OR REPLACE VIEW public.user_activity_monthly AS
SELECT
    user_id,
    DATE_TRUNC('month', created_at) as month_start,
    COUNT(*) as total_activities,
    COUNT(DISTINCT action_type) as unique_action_types,
    COUNT(*) FILTER (WHERE action_type LIKE 'blueprint_%') as blueprint_activities,
    COUNT(*) FILTER (WHERE action_type LIKE 'user_%') as user_management_activities
FROM public.activity_logs
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- ============================================================================
-- SESSION ANALYTICS VIEW
-- ============================================================================

-- Daily session analytics
CREATE OR REPLACE VIEW public.session_analytics_daily AS
SELECT
    user_id,
    DATE(started_at) as session_date,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
    SUM(duration_seconds) as total_duration_seconds,
    AVG(duration_seconds) as avg_duration_seconds,
    MAX(duration_seconds) as max_duration_seconds,
    SUM(page_views) as total_page_views,
    SUM(actions_count) as total_actions,
    SUM(blueprints_created) as total_blueprints_created,
    SUM(blueprints_viewed) as total_blueprints_viewed,
    COUNT(DISTINCT device_type) as unique_device_types
FROM public.user_sessions
GROUP BY user_id, DATE(started_at);

-- Device type distribution
CREATE OR REPLACE VIEW public.session_device_distribution AS
SELECT
    user_id,
    device_type,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_duration_seconds,
    AVG(duration_seconds) as avg_duration_seconds,
    SUM(page_views) as total_page_views
FROM public.user_sessions
WHERE device_type IS NOT NULL
GROUP BY user_id, device_type;

-- Browser distribution
CREATE OR REPLACE VIEW public.session_browser_distribution AS
SELECT
    user_id,
    browser,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_duration_seconds,
    AVG(duration_seconds) as avg_duration_seconds
FROM public.user_sessions
WHERE browser IS NOT NULL
GROUP BY user_id, browser;

-- ============================================================================
-- BLUEPRINT ANALYTICS VIEW
-- ============================================================================

-- Daily blueprint creation statistics
CREATE OR REPLACE VIEW public.blueprint_analytics_daily AS
SELECT
    user_id,
    DATE(created_at) as creation_date,
    COUNT(*) as total_blueprints,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE status = 'generating') as generating_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'error') as error_count
FROM public.blueprint_generator
GROUP BY user_id, DATE(created_at);

-- Blueprint completion rate by user
CREATE OR REPLACE VIEW public.blueprint_completion_rate AS
SELECT
    user_id,
    COUNT(*) as total_blueprints,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_blueprints,
    COUNT(*) FILTER (WHERE status = 'error') as failed_blueprints,
    CASE
        WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0
    END as completion_rate_percentage
FROM public.blueprint_generator
GROUP BY user_id;

-- ============================================================================
-- USER ENGAGEMENT METRICS VIEW
-- ============================================================================

-- Comprehensive user engagement metrics
CREATE OR REPLACE VIEW public.user_engagement_metrics AS
SELECT
    up.user_id,
    up.full_name,
    up.subscription_tier,
    up.user_role,
    up.created_at as user_created_at,

    -- Blueprint metrics
    COUNT(DISTINCT bg.id) as total_blueprints,
    COUNT(DISTINCT bg.id) FILTER (WHERE bg.status = 'completed') as completed_blueprints,

    -- Activity metrics
    COUNT(DISTINCT al.id) as total_activities,

    -- Session metrics
    COUNT(DISTINCT us.id) as total_sessions,
    COALESCE(SUM(us.duration_seconds), 0) as total_session_duration,
    COALESCE(AVG(us.duration_seconds), 0) as avg_session_duration,
    COALESCE(SUM(us.page_views), 0) as total_page_views,
    COALESCE(SUM(us.actions_count), 0) as total_actions,

    -- Engagement score (weighted composite metric)
    (
        (COUNT(DISTINCT bg.id) FILTER (WHERE bg.status = 'completed')) * 10 +
        (COUNT(DISTINCT us.id)) * 2 +
        (COALESCE(SUM(us.page_views), 0)) * 0.5 +
        (COUNT(DISTINCT al.id)) * 1
    )::INTEGER as engagement_score,

    -- Last activity timestamp
    GREATEST(
        COALESCE(MAX(bg.updated_at), '1970-01-01'::timestamptz),
        COALESCE(MAX(al.created_at), '1970-01-01'::timestamptz),
        COALESCE(MAX(us.last_activity_at), '1970-01-01'::timestamptz)
    ) as last_activity_at

FROM public.user_profiles up
LEFT JOIN public.blueprint_generator bg ON up.user_id = bg.user_id
LEFT JOIN public.activity_logs al ON up.user_id = al.user_id
LEFT JOIN public.user_sessions us ON up.user_id = us.user_id
GROUP BY up.user_id, up.full_name, up.subscription_tier, up.user_role, up.created_at;

-- ============================================================================
-- ANALYTICS AGGREGATION FUNCTIONS
-- ============================================================================

-- Function to get user analytics for a date range
CREATE OR REPLACE FUNCTION get_user_analytics(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', p_user_id,
        'date_range', json_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'blueprints', (
            SELECT json_build_object(
                'total', COUNT(*),
                'completed', COUNT(*) FILTER (WHERE status = 'completed'),
                'draft', COUNT(*) FILTER (WHERE status = 'draft'),
                'generating', COUNT(*) FILTER (WHERE status = 'generating'),
                'error', COUNT(*) FILTER (WHERE status = 'error')
            )
            FROM public.blueprint_generator
            WHERE user_id = p_user_id
            AND created_at BETWEEN p_start_date AND p_end_date
        ),
        'activities', (
            SELECT json_build_object(
                'total', COUNT(*),
                'unique_types', COUNT(DISTINCT action_type)
            )
            FROM public.activity_logs
            WHERE user_id = p_user_id
            AND created_at BETWEEN p_start_date AND p_end_date
        ),
        'sessions', (
            SELECT json_build_object(
                'total', COUNT(*),
                'active', COUNT(*) FILTER (WHERE is_active = true),
                'total_duration', COALESCE(SUM(duration_seconds), 0),
                'avg_duration', COALESCE(AVG(duration_seconds), 0),
                'total_page_views', COALESCE(SUM(page_views), 0),
                'total_actions', COALESCE(SUM(actions_count), 0),
                'devices', json_agg(DISTINCT device_type)
            )
            FROM public.user_sessions
            WHERE user_id = p_user_id
            AND started_at BETWEEN p_start_date AND p_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function to get platform-wide analytics
CREATE OR REPLACE FUNCTION get_platform_analytics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'date_range', json_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'users', (
            SELECT json_build_object(
                'total', COUNT(*),
                'active', COUNT(*) FILTER (
                    WHERE user_id IN (
                        SELECT DISTINCT user_id FROM public.activity_logs
                        WHERE created_at BETWEEN p_start_date AND p_end_date
                    )
                ),
                'by_tier', json_object_agg(subscription_tier, tier_count)
            )
            FROM (
                SELECT
                    subscription_tier,
                    COUNT(*) as tier_count
                FROM public.user_profiles
                GROUP BY subscription_tier
            ) tier_stats,
            public.user_profiles
        ),
        'blueprints', (
            SELECT json_build_object(
                'total', COUNT(*),
                'completed', COUNT(*) FILTER (WHERE status = 'completed'),
                'draft', COUNT(*) FILTER (WHERE status = 'draft'),
                'generating', COUNT(*) FILTER (WHERE status = 'generating'),
                'error', COUNT(*) FILTER (WHERE status = 'error'),
                'completion_rate', ROUND(
                    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
                     NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2
                )
            )
            FROM public.blueprint_generator
            WHERE created_at BETWEEN p_start_date AND p_end_date
        ),
        'sessions', (
            SELECT json_build_object(
                'total', COUNT(*),
                'active', COUNT(*) FILTER (WHERE is_active = true),
                'total_duration', COALESCE(SUM(duration_seconds), 0),
                'avg_duration', COALESCE(ROUND(AVG(duration_seconds)), 0),
                'total_page_views', COALESCE(SUM(page_views), 0)
            )
            FROM public.user_sessions
            WHERE started_at BETWEEN p_start_date AND p_end_date
        ),
        'activities', (
            SELECT json_build_object(
                'total', COUNT(*),
                'unique_types', COUNT(DISTINCT action_type),
                'top_actions', (
                    SELECT json_agg(json_build_object('type', action_type, 'count', cnt))
                    FROM (
                        SELECT action_type, COUNT(*) as cnt
                        FROM public.activity_logs
                        WHERE created_at BETWEEN p_start_date AND p_end_date
                        GROUP BY action_type
                        ORDER BY cnt DESC
                        LIMIT 10
                    ) top_actions
                )
            )
            FROM public.activity_logs
            WHERE created_at BETWEEN p_start_date AND p_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Add comments for documentation
COMMENT ON VIEW public.user_activity_daily IS 'Daily aggregation of user activities';
COMMENT ON VIEW public.user_activity_weekly IS 'Weekly aggregation of user activities';
COMMENT ON VIEW public.user_activity_monthly IS 'Monthly aggregation of user activities';
COMMENT ON VIEW public.session_analytics_daily IS 'Daily session analytics with engagement metrics';
COMMENT ON VIEW public.session_device_distribution IS 'Device type usage distribution per user';
COMMENT ON VIEW public.session_browser_distribution IS 'Browser usage distribution per user';
COMMENT ON VIEW public.blueprint_analytics_daily IS 'Daily blueprint creation and status statistics';
COMMENT ON VIEW public.blueprint_completion_rate IS 'Blueprint completion success rates per user';
COMMENT ON VIEW public.user_engagement_metrics IS 'Comprehensive user engagement scoring and metrics';
COMMENT ON FUNCTION get_user_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Get comprehensive analytics for a specific user within a date range';
COMMENT ON FUNCTION get_platform_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Get platform-wide analytics across all users for a date range';
