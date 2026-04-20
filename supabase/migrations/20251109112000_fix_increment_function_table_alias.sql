-- Migration: Fix increment functions table alias issue
-- Purpose: Fix missing table alias in increment functions causing "column does not exist" error
-- Created: 2025-11-09
--
-- Issue: Line 103 in increment_blueprint_creation_count_v2 references blueprint_usage_metadata without table alias
-- Error: column "blueprint_usage_metadata" does not exist

BEGIN;

-- Drop and recreate the increment_blueprint_creation_count_v2 function with proper aliases
CREATE OR REPLACE FUNCTION increment_blueprint_creation_count_v2(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, reason TEXT, new_count INTEGER)
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_exempt BOOLEAN;
  v_tier TEXT;
  v_rows_updated INTEGER;
  v_last_reset TIMESTAMPTZ;
  v_effective_limit INTEGER;
  v_carryover INTEGER;
BEGIN
  -- Start transaction with explicit lock (prevents race conditions)
  PERFORM pg_advisory_xact_lock(hashtext('blueprint_creation_' || p_user_id::text));

  -- Get current state with row lock for atomic operation
  SELECT
    up.blueprint_creation_count,
    up.subscription_tier,
    COALESCE((up.blueprint_usage_metadata->>'exempt_from_limits')::boolean, false),
    (up.blueprint_usage_metadata->>'last_reset')::timestamptz,
    COALESCE((up.blueprint_usage_metadata->>'carryover_creation')::integer, 0)
  INTO v_current_count, v_tier, v_is_exempt, v_last_reset, v_carryover
  FROM user_profiles up
  WHERE up.user_id = p_user_id
  FOR UPDATE;

  -- FAIL-CLOSED: If no user profile found, deny operation
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'User profile not found - operation denied'::TEXT,
      0;
    RETURN;
  END IF;

  -- Get tier limits from centralized configuration
  SELECT creation_limit
  INTO v_limit
  FROM get_tier_limits(v_tier);

  -- FAIL-CLOSED: If tier configuration not found, deny operation
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT
      false,
      'Tier configuration not found - operation denied'::TEXT,
      v_current_count;
    RETURN;
  END IF;

  -- Check if user is exempt (developer tier, enterprise, or explicitly exempt)
  IF v_is_exempt OR v_limit = -1 OR v_tier IN ('developer', 'enterprise') THEN
    -- Increment for exempt users
    UPDATE user_profiles
    SET
      blueprint_creation_count = blueprint_creation_count + 1,
      blueprint_usage_metadata = jsonb_set(
        COALESCE(blueprint_usage_metadata, '{}'::jsonb),
        '{last_blueprint_created}',
        to_jsonb(NOW())
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- FAIL-CLOSED: Verify update succeeded even for exempt users
    IF v_rows_updated = 0 THEN
      RETURN QUERY SELECT
        false,
        'Update failed - concurrent modification detected'::TEXT,
        v_current_count;
      RETURN;
    END IF;

    RETURN QUERY SELECT
      true,
      'Success - exempt from limits'::TEXT,
      v_current_count + 1;
    RETURN;
  END IF;

  -- Check monthly reset for non-free tiers
  IF v_tier != 'explorer' AND v_last_reset IS NOT NULL THEN
    -- Reset if more than 30 days have passed
    IF v_last_reset < (NOW() - INTERVAL '30 days') THEN
      v_current_count := 0;

      -- Only reset creation counter, NOT saving counter
      UPDATE user_profiles
      SET
        blueprint_creation_count = 0,
        blueprint_usage_metadata = jsonb_set(
          COALESCE(blueprint_usage_metadata, '{}'::jsonb),
          '{last_creation_reset}',
          to_jsonb(NOW())
        ),
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- Calculate effective limit (accounting for any carryover) - FIX: use v_carryover variable
  v_effective_limit := v_limit;
  IF v_tier != 'explorer' AND v_carryover > 0 THEN
    v_effective_limit := v_limit + v_carryover;
  END IF;

  -- FAIL-CLOSED: Check limit (deny if at or over limit)
  IF v_current_count >= v_effective_limit THEN
    RETURN QUERY SELECT
      false,
      format('Limit exceeded: %s/%s', v_current_count, v_effective_limit)::TEXT,
      v_current_count;
    RETURN;
  END IF;

  -- Atomic increment with optimistic check
  UPDATE user_profiles
  SET
    blueprint_creation_count = blueprint_creation_count + 1,
    blueprint_usage_metadata = jsonb_set(
      COALESCE(blueprint_usage_metadata, '{}'::jsonb),
      '{last_blueprint_created}',
      to_jsonb(NOW())
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND blueprint_creation_count = v_current_count; -- Optimistic lock check

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  -- FAIL-CLOSED: If no rows updated, concurrent modification occurred
  IF v_rows_updated = 0 THEN
    RETURN QUERY SELECT
      false,
      'Concurrent modification detected - please retry'::TEXT,
      v_current_count;
    RETURN;
  END IF;

  -- Success
  RETURN QUERY SELECT
    true,
    'Blueprint creation count incremented successfully'::TEXT,
    v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix increment_blueprint_saving_count_v2 if it has the same issue
CREATE OR REPLACE FUNCTION increment_blueprint_saving_count_v2(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, reason TEXT, new_count INTEGER)
AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_exempt BOOLEAN;
  v_tier TEXT;
  v_rows_updated INTEGER;
  v_last_reset TIMESTAMPTZ;
  v_effective_limit INTEGER;
  v_carryover INTEGER;
BEGIN
  -- Start transaction with explicit lock (prevents race conditions)
  PERFORM pg_advisory_xact_lock(hashtext('blueprint_saving_' || p_user_id::text));

  -- Get current state with row lock for atomic operation
  SELECT
    up.blueprint_saving_count,
    up.subscription_tier,
    COALESCE((up.blueprint_usage_metadata->>'exempt_from_limits')::boolean, false),
    (up.blueprint_usage_metadata->>'last_saving_reset')::timestamptz,
    COALESCE((up.blueprint_usage_metadata->>'carryover_saving')::integer, 0)
  INTO v_current_count, v_tier, v_is_exempt, v_last_reset, v_carryover
  FROM user_profiles up
  WHERE up.user_id = p_user_id
  FOR UPDATE;

  -- FAIL-CLOSED: If no user profile found, deny operation
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      'User profile not found - operation denied'::TEXT,
      0;
    RETURN;
  END IF;

  -- Get tier limits from centralized configuration
  SELECT saving_limit
  INTO v_limit
  FROM get_tier_limits(v_tier);

  -- FAIL-CLOSED: If tier configuration not found, deny operation
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT
      false,
      'Tier configuration not found - operation denied'::TEXT,
      v_current_count;
    RETURN;
  END IF;

  -- Check if user is exempt (developer tier, enterprise, or explicitly exempt)
  IF v_is_exempt OR v_limit = -1 OR v_tier IN ('developer', 'enterprise') THEN
    -- Increment for exempt users
    UPDATE user_profiles
    SET
      blueprint_saving_count = blueprint_saving_count + 1,
      blueprint_usage_metadata = jsonb_set(
        COALESCE(blueprint_usage_metadata, '{}'::jsonb),
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- FAIL-CLOSED: Verify update succeeded even for exempt users
    IF v_rows_updated = 0 THEN
      RETURN QUERY SELECT
        false,
        'Update failed - concurrent modification detected'::TEXT,
        v_current_count;
      RETURN;
    END IF;

    RETURN QUERY SELECT
      true,
      'Success - exempt from limits'::TEXT,
      v_current_count + 1;
    RETURN;
  END IF;

  -- Check monthly reset for non-free tiers
  IF v_tier != 'explorer' AND v_last_reset IS NOT NULL THEN
    -- Reset if more than 30 days have passed
    IF v_last_reset < (NOW() - INTERVAL '30 days') THEN
      v_current_count := 0;

      -- Only reset saving counter, NOT creation counter
      UPDATE user_profiles
      SET
        blueprint_saving_count = 0,
        blueprint_usage_metadata = jsonb_set(
          COALESCE(blueprint_usage_metadata, '{}'::jsonb),
          '{last_saving_reset}',
          to_jsonb(NOW())
        ),
        updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- Calculate effective limit (accounting for any carryover) - FIX: use v_carryover variable
  v_effective_limit := v_limit;
  IF v_tier != 'explorer' AND v_carryover > 0 THEN
    v_effective_limit := v_limit + v_carryover;
  END IF;

  -- FAIL-CLOSED: Check limit (deny if at or over limit)
  IF v_current_count >= v_effective_limit THEN
    RETURN QUERY SELECT
      false,
      format('Limit exceeded: %s/%s', v_current_count, v_effective_limit)::TEXT,
      v_current_count;
    RETURN;
  END IF;

  -- Atomic increment with optimistic check
  UPDATE user_profiles
  SET
    blueprint_saving_count = blueprint_saving_count + 1,
    blueprint_usage_metadata = jsonb_set(
      COALESCE(blueprint_usage_metadata, '{}'::jsonb),
      '{last_blueprint_saved}',
      to_jsonb(NOW())
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND blueprint_saving_count = v_current_count; -- Optimistic lock check

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  -- FAIL-CLOSED: If no rows updated, concurrent modification occurred
  IF v_rows_updated = 0 THEN
    RETURN QUERY SELECT
      false,
      'Concurrent modification detected - please retry'::TEXT,
      v_current_count;
    RETURN;
  END IF;

  -- Success
  RETURN QUERY SELECT
    true,
    'Blueprint saving count incremented successfully'::TEXT,
    v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed table alias issue in increment functions';
  RAISE NOTICE 'Both increment_blueprint_creation_count_v2 and increment_blueprint_saving_count_v2 now properly reference blueprint_usage_metadata with table alias';
END $$;

COMMIT;