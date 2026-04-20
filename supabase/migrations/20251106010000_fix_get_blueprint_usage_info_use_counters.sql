-- Migration: Fix get_blueprint_usage_info to Use Counter Columns
-- Purpose: Update get_blueprint_usage_info to use counter-based tracking
-- Author: System
-- Date: 2025-11-06
--
-- Context:
-- The previous implementation called get_actual_blueprint_creation_count and
-- get_actual_blueprint_saving_count which queried blueprint_generator table.
-- Those functions were dropped in migration 20251106000000.
--
-- This migration updates get_blueprint_usage_info to read directly from
-- counter columns (blueprint_creation_count, blueprint_saving_count) which
-- are THE single source of truth for usage tracking.

BEGIN;

-- =============================================================================
-- Update get_blueprint_usage_info to Use Counter Columns
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_blueprint_usage_info(p_user_id UUID)
RETURNS TABLE(
  creation_count INTEGER,
  saving_count INTEGER,
  creation_limit INTEGER,
  saving_limit INTEGER,
  is_exempt BOOLEAN,
  exemption_reason TEXT,
  last_creation TIMESTAMPTZ,
  last_saving TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_limits RECORD;
BEGIN
  -- Get effective limits (handles monthly resets, carryover, exemptions)
  SELECT * INTO v_effective_limits FROM get_effective_limits(p_user_id);

  -- Return data using counter columns as source of truth
  RETURN QUERY
  SELECT
    -- Use counter columns directly (single source of truth)
    up.blueprint_creation_count as creation_count,
    up.blueprint_saving_count as saving_count,
    -- Use effective limits (includes carryover calculations)
    v_effective_limits.creation_limit as creation_limit,
    v_effective_limits.saving_limit as saving_limit,
    -- Exemption status
    COALESCE((up.blueprint_usage_metadata->>'exempt_from_limits')::boolean, false) as is_exempt,
    up.blueprint_usage_metadata->>'exemption_reason' as exemption_reason,
    -- Last timestamps from metadata
    (up.blueprint_usage_metadata->>'last_blueprint_created')::TIMESTAMPTZ as last_creation,
    (up.blueprint_usage_metadata->>'last_blueprint_saved')::TIMESTAMPTZ as last_saving
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  -- If no user found, return defaults
  IF NOT FOUND THEN
    RAISE NOTICE 'User profile not found for user_id: %', p_user_id;

    RETURN QUERY
    SELECT
      0::INTEGER as creation_count,
      0::INTEGER as saving_count,
      0::INTEGER as creation_limit,
      0::INTEGER as saving_limit,
      false as is_exempt,
      NULL::TEXT as exemption_reason,
      NULL::TIMESTAMPTZ as last_creation,
      NULL::TIMESTAMPTZ as last_saving;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_blueprint_usage_info IS
'Returns blueprint usage info using counter columns as the single source of truth.
Called by frontend API endpoints to display current usage.
Counters (blueprint_creation_count, blueprint_saving_count) are incremented atomically
by increment_blueprint_creation_count_v2 and increment_blueprint_saving_count_v2.';

COMMIT;

-- =============================================================================
-- Verification Query
-- =============================================================================

-- Run this to verify the fix works:
-- SELECT * FROM get_blueprint_usage_info('<your-user-id>'::UUID);
--
-- Compare with direct counter query:
-- SELECT
--   blueprint_creation_count,
--   blueprint_saving_count,
--   blueprint_creation_limit,
--   blueprint_saving_limit
-- FROM user_profiles
-- WHERE user_id = '<your-user-id>'::UUID;
