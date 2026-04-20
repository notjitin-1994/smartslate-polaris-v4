-- Migration: Backfill Activity Logs for Existing Users
-- Description: Creates initial activity log entries for users who existed before the logging system
-- Author: SmartSlate Team
-- Date: 2025-11-04

-- ============================================================================
-- CREATE HELPER RPC FUNCTIONS
-- ============================================================================

-- Function to get users without activity logs
CREATE OR REPLACE FUNCTION get_users_without_activity_logs()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    u.id as user_id,
    u.email,
    u.created_at
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM activity_logs al
    WHERE al.user_id = u.id
  )
  ORDER BY u.created_at DESC;
$$;

-- Function to get blueprints without activity logs
CREATE OR REPLACE FUNCTION get_blueprints_without_activity_logs()
RETURNS TABLE (
  blueprint_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    bg.id as blueprint_id,
    bg.user_id,
    bg.created_at
  FROM blueprint_generator bg
  WHERE NOT EXISTS (
    SELECT 1
    FROM activity_logs al
    WHERE al.resource_type = 'blueprint'
      AND al.resource_id = bg.id::text
      AND al.action_type = 'blueprint_created'
  )
  ORDER BY bg.created_at DESC;
$$;

-- Function to backfill user_created logs
CREATE OR REPLACE FUNCTION backfill_user_created_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    created_at
  )
  SELECT
    u.id AS user_id,
    NULL AS actor_id,
    'user_created' AS action_type,
    'user' AS resource_type,
    u.id AS resource_id,
    jsonb_build_object(
      'backfilled', true,
      'source', 'backfill_api',
      'email', u.email,
      'original_created_at', u.created_at
    ) AS metadata,
    u.created_at AS created_at
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM activity_logs al
    WHERE al.user_id = u.id
      AND al.action_type = 'user_created'
  )
  ORDER BY u.created_at ASC;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

-- Function to backfill user_updated logs
CREATE OR REPLACE FUNCTION backfill_user_updated_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    created_at
  )
  SELECT
    up.user_id,
    NULL AS actor_id,
    'user_updated' AS action_type,
    'user' AS resource_type,
    up.user_id AS resource_id,
    jsonb_build_object(
      'backfilled', true,
      'source', 'backfill_api',
      'profile_updated', true,
      'original_updated_at', up.updated_at
    ) AS metadata,
    up.updated_at AS created_at
  FROM user_profiles up
  WHERE up.updated_at IS NOT NULL
    AND up.updated_at > up.created_at
    AND NOT EXISTS (
      SELECT 1
      FROM activity_logs al
      WHERE al.user_id = up.user_id
        AND al.action_type = 'user_updated'
        AND al.created_at BETWEEN up.updated_at - INTERVAL '1 minute'
                              AND up.updated_at + INTERVAL '1 minute'
    )
  ORDER BY up.updated_at ASC;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

-- Function to backfill blueprint_created logs
CREATE OR REPLACE FUNCTION backfill_blueprint_created_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INTEGER;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    created_at
  )
  SELECT
    bg.user_id,
    bg.user_id AS actor_id,
    'blueprint_created' AS action_type,
    'blueprint' AS resource_type,
    bg.id::text AS resource_id,
    jsonb_build_object(
      'backfilled', true,
      'source', 'backfill_api',
      'blueprint_id', bg.id,
      'status', bg.status,
      'original_created_at', bg.created_at
    ) AS metadata,
    bg.created_at AS created_at
  FROM blueprint_generator bg
  WHERE bg.created_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM activity_logs al
      WHERE al.resource_type = 'blueprint'
        AND al.resource_id = bg.id::text
        AND al.action_type = 'blueprint_created'
    )
  ORDER BY bg.created_at ASC;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

COMMENT ON FUNCTION get_users_without_activity_logs IS 'Returns list of users who have no activity log entries';
COMMENT ON FUNCTION get_blueprints_without_activity_logs IS 'Returns list of blueprints without activity log entries';
COMMENT ON FUNCTION backfill_user_created_logs IS 'Backfills user_created activity logs for existing users';
COMMENT ON FUNCTION backfill_user_updated_logs IS 'Backfills user_updated activity logs for users with profile updates';
COMMENT ON FUNCTION backfill_blueprint_created_logs IS 'Backfills blueprint_created activity logs for existing blueprints';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_without_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_blueprints_without_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_user_created_logs TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_user_updated_logs TO authenticated;
GRANT EXECUTE ON FUNCTION backfill_blueprint_created_logs TO authenticated;

-- ============================================================================
-- BACKFILL USER_CREATED LOGS (RUN IMMEDIATELY)
-- ============================================================================

-- Create user_created logs for all existing users in auth.users who don't have any activity logs yet
-- Uses the user's created_at timestamp from auth.users
INSERT INTO activity_logs (
  user_id,
  actor_id,
  action_type,
  resource_type,
  resource_id,
  metadata,
  created_at
)
SELECT
  u.id AS user_id,
  NULL AS actor_id,  -- No actor for system-generated backfill entries
  'user_created' AS action_type,
  'user' AS resource_type,
  u.id AS resource_id,
  jsonb_build_object(
    'backfilled', true,
    'source', 'migration_20251104020000',
    'email', u.email,
    'original_created_at', u.created_at
  ) AS metadata,
  u.created_at AS created_at
FROM auth.users u
WHERE NOT EXISTS (
  -- Only insert if user doesn't have any activity logs yet
  SELECT 1
  FROM activity_logs al
  WHERE al.user_id = u.id
)
ORDER BY u.created_at ASC;

-- ============================================================================
-- BACKFILL USER_UPDATED LOGS (PROFILE UPDATES)
-- ============================================================================

-- Create user_updated logs for users who have profiles with updated_at != created_at
-- This indicates they were updated after creation
INSERT INTO activity_logs (
  user_id,
  actor_id,
  action_type,
  resource_type,
  resource_id,
  metadata,
  created_at
)
SELECT
  up.user_id,
  NULL AS actor_id,
  'user_updated' AS action_type,
  'user' AS resource_type,
  up.user_id AS resource_id,
  jsonb_build_object(
    'backfilled', true,
    'source', 'migration_20251104020000',
    'profile_updated', true,
    'original_updated_at', up.updated_at
  ) AS metadata,
  up.updated_at AS created_at
FROM user_profiles up
WHERE up.updated_at IS NOT NULL
  AND up.updated_at > up.created_at
  AND NOT EXISTS (
    -- Only insert if no user_updated log exists near this timestamp (within 1 minute)
    SELECT 1
    FROM activity_logs al
    WHERE al.user_id = up.user_id
      AND al.action_type = 'user_updated'
      AND al.created_at BETWEEN up.updated_at - INTERVAL '1 minute'
                            AND up.updated_at + INTERVAL '1 minute'
  )
ORDER BY up.updated_at ASC;

-- ============================================================================
-- BACKFILL BLUEPRINT_CREATED LOGS
-- ============================================================================

-- Create blueprint_created logs for all existing blueprints
INSERT INTO activity_logs (
  user_id,
  actor_id,
  action_type,
  resource_type,
  resource_id,
  metadata,
  created_at
)
SELECT
  bg.user_id,
  bg.user_id AS actor_id,  -- User is the actor for their own blueprint creation
  'blueprint_created' AS action_type,
  'blueprint' AS resource_type,
  bg.id::text AS resource_id,
  jsonb_build_object(
    'backfilled', true,
    'source', 'migration_20251104020000',
    'blueprint_id', bg.id,
    'status', bg.status,
    'original_created_at', bg.created_at
  ) AS metadata,
  bg.created_at AS created_at
FROM blueprint_generator bg
WHERE bg.created_at IS NOT NULL
  AND NOT EXISTS (
    -- Only insert if no blueprint_created log exists for this blueprint
    SELECT 1
    FROM activity_logs al
    WHERE al.resource_type = 'blueprint'
      AND al.resource_id = bg.id::text
      AND al.action_type = 'blueprint_created'
  )
ORDER BY bg.created_at ASC;

-- ============================================================================
-- VERIFICATION QUERIES (FOR REFERENCE)
-- ============================================================================

-- After running migration, verify the results:
/*

-- 1. Count of backfilled logs by action type
SELECT
  action_type,
  COUNT(*) as count,
  COUNT(CASE WHEN metadata->>'backfilled' = 'true' THEN 1 END) as backfilled_count
FROM activity_logs
GROUP BY action_type
ORDER BY action_type;

-- 2. Check users without any activity logs
SELECT
  u.id,
  u.email,
  u.created_at,
  COUNT(al.id) as activity_count
FROM auth.users u
LEFT JOIN activity_logs al ON al.user_id = u.id
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(al.id) = 0
ORDER BY u.created_at DESC;

-- 3. Sample of backfilled logs
SELECT
  action_type,
  resource_type,
  metadata->>'backfilled' as is_backfilled,
  metadata->>'source' as source,
  created_at
FROM activity_logs
WHERE metadata->>'backfilled' = 'true'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Timeline of activities (including backfilled)
SELECT
  DATE_TRUNC('day', created_at) as date,
  action_type,
  COUNT(*) as count,
  COUNT(CASE WHEN metadata->>'backfilled' = 'true' THEN 1 END) as backfilled
FROM activity_logs
GROUP BY DATE_TRUNC('day', created_at), action_type
ORDER BY date DESC, action_type;

*/

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Log the completion of backfill
DO $$
DECLARE
  v_user_created_count INT;
  v_user_updated_count INT;
  v_blueprint_created_count INT;
BEGIN
  -- Count backfilled entries
  SELECT COUNT(*) INTO v_user_created_count
  FROM activity_logs
  WHERE action_type = 'user_created'
    AND metadata->>'backfilled' = 'true';

  SELECT COUNT(*) INTO v_user_updated_count
  FROM activity_logs
  WHERE action_type = 'user_updated'
    AND metadata->>'backfilled' = 'true';

  SELECT COUNT(*) INTO v_blueprint_created_count
  FROM activity_logs
  WHERE action_type = 'blueprint_created'
    AND metadata->>'backfilled' = 'true';

  -- Log summary
  RAISE NOTICE 'Activity logs backfill completed:';
  RAISE NOTICE '  - user_created: % entries', v_user_created_count;
  RAISE NOTICE '  - user_updated: % entries', v_user_updated_count;
  RAISE NOTICE '  - blueprint_created: % entries', v_blueprint_created_count;
  RAISE NOTICE '  - Total: % entries',
    v_user_created_count + v_user_updated_count + v_blueprint_created_count;
END $$;
