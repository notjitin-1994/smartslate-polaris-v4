-- Migration: Enforce Counter-Based Blueprint Tracking
-- Purpose: Make counter columns the single source of truth for usage tracking
-- Author: System
-- Date: 2025-11-06
--
-- Context:
-- This migration enforces counter-based tracking instead of database query-based counting.
-- The increment functions (increment_blueprint_creation_count_v2, increment_blueprint_saving_count_v2)
-- atomically update counter columns with advisory locks and fail-closed semantics.
--
-- Key Principle: Counters are THE source of truth, not derived from blueprint_generator queries.
--
-- Changes:
-- 1. Drop database query functions that conflict with counter approach
-- 2. Update get_effective_limits to use counters exclusively
-- 3. Add audit function for debugging counter accuracy
-- 4. Add comprehensive documentation

-- =============================================================================
-- PHASE 1: Drop Database Query Functions
-- =============================================================================
-- These functions query blueprint_generator table instead of using counters
-- They were introduced in migration 20251029000000 but conflict with user requirements

DROP FUNCTION IF EXISTS public.get_actual_blueprint_creation_count(UUID);
DROP FUNCTION IF EXISTS public.get_actual_blueprint_saving_count(UUID);
DROP FUNCTION IF EXISTS public.get_actual_current_month_counts(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.sync_blueprint_counters(UUID);

-- =============================================================================
-- PHASE 2: Update get_effective_limits to Use Counters Exclusively
-- =============================================================================
-- This function should read directly from counter columns, not query blueprints

CREATE OR REPLACE FUNCTION public.get_effective_limits(p_user_id UUID)
RETURNS TABLE(
  creation_limit INTEGER,
  saving_limit INTEGER,
  creation_used INTEGER,
  saving_used INTEGER,
  creation_available INTEGER,
  saving_available INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_is_exempt BOOLEAN;
  v_creation_count INTEGER;
  v_saving_count INTEGER;
  v_creation_limit INTEGER;
  v_saving_limit INTEGER;
  v_carryover_creation INTEGER;
  v_carryover_saving INTEGER;
  v_carryover_expires TIMESTAMPTZ;
BEGIN
  -- Get user profile data
  SELECT
    up.subscription_tier,
    COALESCE((up.blueprint_usage_metadata->>'exempt_from_limits')::boolean, false),
    up.blueprint_creation_count,  -- Counter as source of truth
    up.blueprint_saving_count,    -- Counter as source of truth
    up.blueprint_creation_limit,
    up.blueprint_saving_limit,
    COALESCE((up.free_tier_carryover_data->>'creation_carryover')::integer, 0),
    COALESCE((up.free_tier_carryover_data->>'saving_carryover')::integer, 0),
    up.free_tier_carryover_expires_at
  INTO
    v_tier,
    v_is_exempt,
    v_creation_count,
    v_saving_count,
    v_creation_limit,
    v_saving_limit,
    v_carryover_creation,
    v_carryover_saving,
    v_carryover_expires
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  -- Handle user not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;

  -- If exempt, return unlimited (-1 indicates unlimited)
  IF v_is_exempt THEN
    RETURN QUERY SELECT
      -1::INTEGER AS creation_limit,
      -1::INTEGER AS saving_limit,
      v_creation_count AS creation_used,
      v_saving_count AS saving_used,
      -1::INTEGER AS creation_available,
      -1::INTEGER AS saving_available;
    RETURN;
  END IF;

  -- Check if carryover has expired
  IF v_carryover_expires IS NOT NULL AND v_carryover_expires < NOW() THEN
    v_carryover_creation := 0;
    v_carryover_saving := 0;
  END IF;

  -- Calculate effective limits (base limit + carryover)
  v_creation_limit := v_creation_limit + v_carryover_creation;
  v_saving_limit := v_saving_limit + v_carryover_saving;

  -- Return effective limits based on counters
  RETURN QUERY SELECT
    v_creation_limit AS creation_limit,
    v_saving_limit AS saving_limit,
    v_creation_count AS creation_used,
    v_saving_count AS saving_used,
    GREATEST(0, v_creation_limit - v_creation_count) AS creation_available,
    GREATEST(0, v_saving_limit - v_saving_count) AS saving_available;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_effective_limits(UUID) IS
'Returns effective blueprint limits using counter columns as source of truth.
Includes carryover calculations for users who upgraded from free tier.
Counters (blueprint_creation_count, blueprint_saving_count) are THE authoritative source.';

-- =============================================================================
-- PHASE 3: Add Audit Function for Counter Accuracy
-- =============================================================================
-- This function helps debug if counters ever get out of sync with reality

CREATE OR REPLACE FUNCTION public.audit_counter_accuracy(p_user_id UUID)
RETURNS TABLE(
  metric TEXT,
  counter_value INTEGER,
  actual_db_count INTEGER,
  difference INTEGER,
  status TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creation_counter INTEGER;
  v_saving_counter INTEGER;
  v_actual_creations INTEGER;
  v_actual_saves INTEGER;
BEGIN
  -- Get counter values
  SELECT
    up.blueprint_creation_count,
    up.blueprint_saving_count
  INTO v_creation_counter, v_saving_counter
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for user_id: %', p_user_id;
  END IF;

  -- Count actual blueprints with dynamic_questions (creation events)
  SELECT COUNT(*)::INTEGER
  INTO v_actual_creations
  FROM blueprint_generator bg
  WHERE bg.user_id = p_user_id
    AND bg.dynamic_questions IS NOT NULL;

  -- Count actual blueprints with blueprint_json (save events)
  SELECT COUNT(*)::INTEGER
  INTO v_actual_saves
  FROM blueprint_generator bg
  WHERE bg.user_id = p_user_id
    AND bg.blueprint_json IS NOT NULL;

  -- Return comparison for creations
  RETURN QUERY SELECT
    'blueprint_creation_count'::TEXT AS metric,
    v_creation_counter AS counter_value,
    v_actual_creations AS actual_db_count,
    (v_creation_counter - v_actual_creations) AS difference,
    CASE
      WHEN v_creation_counter = v_actual_creations THEN 'MATCH'::TEXT
      WHEN v_creation_counter > v_actual_creations THEN 'COUNTER_HIGHER'::TEXT
      ELSE 'DB_HIGHER'::TEXT
    END AS status;

  -- Return comparison for saves
  RETURN QUERY SELECT
    'blueprint_saving_count'::TEXT AS metric,
    v_saving_counter AS counter_value,
    v_actual_saves AS actual_db_count,
    (v_saving_counter - v_actual_saves) AS difference,
    CASE
      WHEN v_saving_counter = v_actual_saves THEN 'MATCH'::TEXT
      WHEN v_saving_counter > v_actual_saves THEN 'COUNTER_HIGHER'::TEXT
      ELSE 'DB_HIGHER'::TEXT
    END AS status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.audit_counter_accuracy(UUID) IS
'Audit function to compare counter values against actual blueprint_generator records.
Use this for debugging if you suspect counters are out of sync.
Note: Counters are still the source of truth for enforcement, this is diagnostic only.';

-- =============================================================================
-- PHASE 4: Add RLS Policy for Audit Function
-- =============================================================================
-- Allow users to audit their own counter accuracy

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.audit_counter_accuracy(UUID) TO authenticated;

-- =============================================================================
-- PHASE 5: Documentation and Comments
-- =============================================================================

COMMENT ON COLUMN public.user_profiles.blueprint_creation_count IS
'PRIMARY SOURCE OF TRUTH: Number of times user has generated dynamic questions.
Incremented atomically by increment_blueprint_creation_count_v2() function.
For free tier (explorer): Lifetime counter, never resets.
For paid tiers: Monthly counter, resets on billing cycle with 12-month history.';

COMMENT ON COLUMN public.user_profiles.blueprint_saving_count IS
'PRIMARY SOURCE OF TRUTH: Number of times user has generated final blueprints.
Incremented atomically by increment_blueprint_saving_count_v2() function.
For free tier (explorer): Lifetime counter, never resets.
For paid tiers: Monthly counter, resets on billing cycle with 12-month history.';

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
-- To rollback this migration, you would need to:
-- 1. Restore the database query functions from migration 20251029000000
-- 2. Revert get_effective_limits to query blueprint_generator table
-- 3. Drop the audit_counter_accuracy function
-- 4. Remove column comments
--
-- However, it's recommended NOT to rollback this migration as it fixes
-- the double-counting bug and enforces the counter-based approach.
