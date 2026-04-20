-- Migration: Create activity aggregation RPC functions
-- Description: PostgreSQL functions for efficient activity data aggregation
-- Author: SmartSlate Team
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- FUNCTION: Get user activity stats (aggregated metrics)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH activity_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE action_type = 'blueprint_created') AS blueprints_created,
      COUNT(*) FILTER (WHERE action_type = 'blueprint_updated') AS blueprints_updated,
      COUNT(*) FILTER (WHERE action_type = 'blueprint_deleted') AS blueprints_deleted,
      COUNT(*) FILTER (WHERE action_type = 'blueprint_exported') AS blueprints_exported,
      COUNT(*) FILTER (WHERE action_type = 'profile_updated') AS profile_updates,
      COUNT(*) FILTER (WHERE action_type = 'user_login') AS total_logins
    FROM activity_logs
    WHERE user_id = p_user_id
  ),
  session_stats AS (
    SELECT
      COUNT(*) AS total_sessions,
      MAX(created_at) AS last_login_at
    FROM user_sessions
    WHERE user_id = p_user_id
  ),
  blueprint_stats AS (
    SELECT
      COUNT(*) AS total_blueprints,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed_blueprints,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS blueprints_last_30_days
    FROM blueprint_generator
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
  ),
  user_info AS (
    SELECT
      created_at AS member_since,
      subscription_tier,
      user_role,
      blueprint_creation_limit,
      blueprint_saving_limit
    FROM user_profiles
    WHERE user_id = p_user_id
  ),
  -- Use actual counts from the database, not cached counter columns
  actual_counts AS (
    SELECT
      get_actual_blueprint_creation_count(p_user_id) AS actual_creation_count,
      get_actual_blueprint_saving_count(p_user_id) AS actual_saving_count
  )
  SELECT json_build_object(
    'blueprints_created', COALESCE(ac.blueprints_created, 0),
    'blueprints_updated', COALESCE(ac.blueprints_updated, 0),
    'blueprints_deleted', COALESCE(ac.blueprints_deleted, 0),
    'blueprints_exported', COALESCE(ac.blueprints_exported, 0),
    'profile_updates', COALESCE(ac.profile_updates, 0),
    'total_logins', COALESCE(ac.total_logins, 0),
    'total_sessions', COALESCE(ss.total_sessions, 0),
    'last_login_at', ss.last_login_at,
    'total_blueprints', COALESCE(bs.total_blueprints, 0),
    'completed_blueprints', COALESCE(bs.completed_blueprints, 0),
    'blueprints_last_30_days', COALESCE(bs.blueprints_last_30_days, 0),
    'member_since', ui.member_since,
    'subscription_tier', ui.subscription_tier,
    'user_role', ui.user_role,
    -- Use actual counts instead of cached counter columns
    'blueprint_creation_count', act.actual_creation_count,
    'blueprint_saving_count', act.actual_saving_count,
    'blueprint_creation_limit', ui.blueprint_creation_limit,
    'blueprint_saving_limit', ui.blueprint_saving_limit,
    'usage_percentage_creation',
      CASE
        WHEN ui.blueprint_creation_limit > 0
        THEN ROUND((act.actual_creation_count::NUMERIC / ui.blueprint_creation_limit::NUMERIC) * 100, 2)
        ELSE 0
      END,
    'usage_percentage_saving',
      CASE
        WHEN ui.blueprint_saving_limit > 0
        THEN ROUND((act.actual_saving_count::NUMERIC / ui.blueprint_saving_limit::NUMERIC) * 100, 2)
        ELSE 0
      END
  ) INTO v_result
  FROM activity_counts ac
  CROSS JOIN session_stats ss
  CROSS JOIN blueprint_stats bs
  CROSS JOIN user_info ui
  CROSS JOIN actual_counts act;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- FUNCTION: Get recent user activity (paginated)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_recent_activity(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  actor_id UUID,
  actor_full_name TEXT,
  actor_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action_type,
    al.resource_type,
    al.resource_id,
    al.metadata,
    al.created_at,
    al.actor_id,
    up.full_name AS actor_full_name,
    up.avatar_url AS actor_avatar_url
  FROM activity_logs al
  LEFT JOIN user_profiles up ON up.user_id = al.actor_id
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- FUNCTION: Get activity count for user (for pagination)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_activity_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM activity_logs
  WHERE user_id = p_user_id;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Get user login history (last N logins)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_login_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    us.created_at,
    us.ip_address,
    us.user_agent,
    us.device_info,
    us.location_info
  FROM user_sessions us
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_activity_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_login_history TO authenticated;

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_activity_stats IS 'Returns aggregated activity statistics for a user including blueprints, logins, and usage metrics';
COMMENT ON FUNCTION get_user_recent_activity IS 'Returns paginated recent activity for a user with actor information';
COMMENT ON FUNCTION get_user_activity_count IS 'Returns total activity count for pagination';
COMMENT ON FUNCTION get_user_login_history IS 'Returns recent login history with device and location info';

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*

-- Get activity stats for current user
SELECT get_user_activity_stats(auth.uid());

-- Get recent activity (first page, 10 items)
SELECT * FROM get_user_recent_activity(auth.uid(), 10, 0);

-- Get total activity count
SELECT get_user_activity_count(auth.uid());

-- Get login history (last 10 logins)
SELECT * FROM get_user_login_history(auth.uid(), 10);

*/
