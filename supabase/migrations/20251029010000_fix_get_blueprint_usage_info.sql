-- Migration: 20251029010000_fix_get_blueprint_usage_info.sql
-- Description: Update get_blueprint_usage_info to use actual database counts
-- Author: System
-- Date: 2025-10-29
--
-- This fixes the frontend display issue where counts show as 0 even when blueprints exist.
-- The function now queries actual blueprint_generator records instead of reading counter columns.

BEGIN;

-- ============================================================================
-- Update get_blueprint_usage_info to use actual counts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_blueprint_usage_info(p_user_id UUID)
RETURNS TABLE(
  creation_count INTEGER,
  saving_count INTEGER,
  creation_limit INTEGER,
  saving_limit INTEGER,
  is_exempt BOOLEAN,
  exemption_reason TEXT,
  last_creation TIMESTAMPTZ,
  last_saving TIMESTAMPTZ
) AS $$
DECLARE
  v_user_role TEXT;
  v_subscription_tier TEXT;
  v_actual_creation_count INTEGER;
  v_actual_saving_count INTEGER;
  v_effective_limits RECORD;
BEGIN
  -- Get user role and tier
  SELECT
    up.user_role,
    up.subscription_tier
  INTO
    v_user_role,
    v_subscription_tier
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  -- Get actual counts from database
  v_actual_creation_count := get_actual_blueprint_creation_count(p_user_id);
  v_actual_saving_count := get_actual_blueprint_saving_count(p_user_id);

  -- Get effective limits (which handles monthly resets, carryover, etc.)
  SELECT * INTO v_effective_limits FROM get_effective_limits(p_user_id);

  -- Return the data
  RETURN QUERY
  SELECT
    v_actual_creation_count as creation_count,
    v_actual_saving_count as saving_count,
    v_effective_limits.creation_limit as creation_limit,
    v_effective_limits.saving_limit as saving_limit,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean as is_exempt,
    up.blueprint_usage_metadata->>'exemption_reason' as exemption_reason,
    (up.blueprint_usage_metadata->>'last_blueprint_created')::TIMESTAMPTZ as last_creation,
    (up.blueprint_usage_metadata->>'last_blueprint_saved')::TIMESTAMPTZ as last_saving
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_blueprint_usage_info IS
'Returns blueprint usage info using ACTUAL counts from blueprint_generator table. Used by frontend API.';

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify the fix:
-- SELECT * FROM get_blueprint_usage_info('your-user-id'::UUID);
--
-- Compare with actual counts:
-- SELECT
--   get_actual_blueprint_creation_count('your-user-id'::UUID) as actual_creation,
--   get_actual_blueprint_saving_count('your-user-id'::UUID) as actual_saving;
