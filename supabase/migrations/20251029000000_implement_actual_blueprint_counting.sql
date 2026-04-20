-- Migration: 20251029000000_implement_actual_blueprint_counting.sql
-- Description: Implement actual database-based blueprint counting instead of counter columns
-- Author: System
-- Date: 2025-10-29
--
-- This migration changes the counting logic to query actual blueprint_generator records
-- instead of relying on counter columns in user_profiles. This ensures accuracy even if
-- counters get out of sync or blueprints are deleted.
--
-- Key Changes:
-- 1. Add helper functions to count actual blueprints from blueprint_generator table
-- 2. Modify get_effective_limits to use actual counts
-- 3. Modify increment functions to be idempotent (safe to call multiple times)
-- 4. Keep counter columns for backwards compatibility but don't rely on them

BEGIN;

-- ============================================================================
-- 1. Helper function: Count actual created blueprints for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_actual_blueprint_creation_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count all blueprint records for this user (any status)
  -- This represents how many times they've initiated blueprint generation
  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_blueprint_creation_count IS
'Returns the actual count of blueprints created by querying the blueprint_generator table. Counts all statuses.';

-- ============================================================================
-- 2. Helper function: Count actual saved blueprints for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_actual_blueprint_saving_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count only completed blueprints with actual blueprint data
  -- This represents successfully generated and saved blueprints
  SELECT COUNT(*)::INTEGER
  INTO v_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND blueprint_json IS NOT NULL;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_blueprint_saving_count IS
'Returns the actual count of saved blueprints by querying blueprint_generator for completed records with data.';

-- ============================================================================
-- 3. Helper function: Get actual counts for current month (paid tiers)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_actual_current_month_counts(
  p_user_id UUID,
  p_billing_cycle_start TIMESTAMPTZ
)
RETURNS TABLE(
  creation_count INTEGER,
  saving_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Count all blueprints created since billing cycle started
    COUNT(*)::INTEGER as creation_count,
    -- Count only completed blueprints since billing cycle started
    COUNT(*) FILTER (
      WHERE status = 'completed'
        AND blueprint_json IS NOT NULL
    )::INTEGER as saving_count
  FROM public.blueprint_generator
  WHERE user_id = p_user_id
    AND created_at >= p_billing_cycle_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_actual_current_month_counts IS
'Returns actual creation and saving counts for the current billing cycle by querying blueprint_generator with date filter.';

-- ============================================================================
-- 4. Update: get_effective_limits to use actual counts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_effective_limits(p_user_id UUID)
RETURNS TABLE(
  creation_limit INTEGER,
  saving_limit INTEGER,
  creation_used INTEGER,
  saving_used INTEGER,
  creation_available INTEGER,
  saving_available INTEGER
) AS $$
DECLARE
  v_subscription_tier TEXT;
  v_user_role TEXT;
  v_base_creation_limit INTEGER;
  v_base_saving_limit INTEGER;
  v_billing_cycle_start TIMESTAMPTZ;
  v_actual_creation_count INTEGER;
  v_actual_saving_count INTEGER;
  v_upgraded_from_free BOOLEAN;
  v_free_tier_expires_at TIMESTAMPTZ;
  v_free_tier_carryover JSONB;
  v_creation_carryover INTEGER := 0;
  v_saving_carryover INTEGER := 0;
  v_is_exempt BOOLEAN;
  v_month_counts RECORD;
BEGIN
  -- Get user data
  SELECT
    up.subscription_tier,
    up.user_role,
    up.blueprint_creation_limit,
    up.blueprint_saving_limit,
    up.billing_cycle_start_date,
    up.upgraded_from_free_tier,
    up.free_tier_carryover_expires_at,
    up.free_tier_carryover_data,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO
    v_subscription_tier,
    v_user_role,
    v_base_creation_limit,
    v_base_saving_limit,
    v_billing_cycle_start,
    v_upgraded_from_free,
    v_free_tier_expires_at,
    v_free_tier_carryover,
    v_is_exempt
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  -- Check if monthly reset is needed (for paid tiers)
  IF should_reset_monthly_limits(p_user_id) THEN
    PERFORM reset_monthly_limits(p_user_id);

    -- Reload billing cycle start after reset
    SELECT billing_cycle_start_date
    INTO v_billing_cycle_start
    FROM public.user_profiles
    WHERE user_id = p_user_id;
  END IF;

  -- Developer role has unlimited access
  IF v_user_role = 'developer' OR v_is_exempt = TRUE THEN
    -- Still return actual counts for display purposes
    v_actual_creation_count := get_actual_blueprint_creation_count(p_user_id);
    v_actual_saving_count := get_actual_blueprint_saving_count(p_user_id);

    RETURN QUERY SELECT -1, -1, v_actual_creation_count, v_actual_saving_count, -1, -1;
    RETURN;
  END IF;

  -- Check for valid free tier carryover
  IF v_upgraded_from_free AND v_free_tier_expires_at IS NOT NULL AND NOW() < v_free_tier_expires_at THEN
    v_creation_carryover := COALESCE((v_free_tier_carryover->>'creation_carryover')::INTEGER, 0);
    v_saving_carryover := COALESCE((v_free_tier_carryover->>'saving_carryover')::INTEGER, 0);
  END IF;

  -- Free tier uses cumulative counts (lifetime limits)
  IF v_subscription_tier = 'free' OR v_subscription_tier = 'explorer' THEN
    -- Get actual lifetime counts
    v_actual_creation_count := get_actual_blueprint_creation_count(p_user_id);
    v_actual_saving_count := get_actual_blueprint_saving_count(p_user_id);

    RETURN QUERY SELECT
      v_base_creation_limit,
      v_base_saving_limit,
      v_actual_creation_count,
      v_actual_saving_count,
      GREATEST(0, v_base_creation_limit - v_actual_creation_count),
      GREATEST(0, v_base_saving_limit - v_actual_saving_count);
  ELSE
    -- Paid tiers use monthly counts + carryover
    -- Get actual counts for current billing cycle
    SELECT * INTO v_month_counts
    FROM get_actual_current_month_counts(p_user_id, v_billing_cycle_start);

    RETURN QUERY SELECT
      v_base_creation_limit + v_creation_carryover,
      v_base_saving_limit + v_saving_carryover,
      v_month_counts.creation_count,
      v_month_counts.saving_count,
      GREATEST(0, (v_base_creation_limit + v_creation_carryover) - v_month_counts.creation_count),
      GREATEST(0, (v_base_saving_limit + v_saving_carryover) - v_month_counts.saving_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_effective_limits IS
'Returns effective limits using ACTUAL counts from blueprint_generator table, not counter columns.';

-- ============================================================================
-- 5. Update: increment_blueprint_creation_count to sync counters
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_blueprint_creation_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
BEGIN
  -- Get effective limits (uses actual counts)
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Exempt users can always create
  IF v_limits.creation_limit = -1 THEN
    -- Update counter columns for backwards compatibility
    UPDATE public.user_profiles
    SET
      blueprint_creation_count = get_actual_blueprint_creation_count(p_user_id),
      current_month_creation_count = blueprint_creation_count,
      blueprint_usage_metadata = jsonb_set(
        COALESCE(blueprint_usage_metadata, '{}'::jsonb),
        '{last_blueprint_created}',
        to_jsonb(NOW())
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check if limit would be exceeded
  IF v_limits.creation_used >= v_limits.creation_limit THEN
    RETURN FALSE;
  END IF;

  -- Sync counter columns with actual counts
  -- This is safe to call multiple times - it just syncs the counters
  UPDATE public.user_profiles
  SET
    blueprint_creation_count = get_actual_blueprint_creation_count(p_user_id),
    current_month_creation_count = blueprint_creation_count,
    blueprint_usage_metadata = jsonb_set(
      COALESCE(blueprint_usage_metadata, '{}'::jsonb),
      '{last_blueprint_created}',
      to_jsonb(NOW())
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_blueprint_creation_count IS
'Checks limits using actual counts and syncs counter columns. Idempotent - safe to call multiple times.';

-- ============================================================================
-- 6. Update: increment_blueprint_saving_count to sync counters
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_blueprint_saving_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
BEGIN
  -- Get effective limits (uses actual counts)
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Exempt users can always save
  IF v_limits.saving_limit = -1 THEN
    -- Update counter columns for backwards compatibility
    UPDATE public.user_profiles
    SET
      blueprint_saving_count = get_actual_blueprint_saving_count(p_user_id),
      current_month_saving_count = blueprint_saving_count,
      blueprint_usage_metadata = jsonb_set(
        COALESCE(blueprint_usage_metadata, '{}'::jsonb),
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check if limit would be exceeded
  IF v_limits.saving_used >= v_limits.saving_limit THEN
    RETURN FALSE;
  END IF;

  -- Sync counter columns with actual counts
  -- This is safe to call multiple times - it just syncs the counters
  UPDATE public.user_profiles
  SET
    blueprint_saving_count = get_actual_blueprint_saving_count(p_user_id),
    current_month_saving_count = blueprint_saving_count,
    blueprint_usage_metadata = jsonb_set(
      COALESCE(blueprint_usage_metadata, '{}'::jsonb),
      '{last_blueprint_saved}',
      to_jsonb(NOW())
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_blueprint_saving_count IS
'Checks limits using actual counts and syncs counter columns. Idempotent - safe to call multiple times.';

-- ============================================================================
-- 7. Add function to sync all counters (for maintenance/admin use)
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_blueprint_counters(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  user_id UUID,
  old_creation_count INTEGER,
  new_creation_count INTEGER,
  old_saving_count INTEGER,
  new_saving_count INTEGER,
  counters_matched BOOLEAN
) AS $$
BEGIN
  IF p_user_id IS NOT NULL THEN
    -- Sync specific user
    RETURN QUERY
    WITH actual_counts AS (
      SELECT
        up.user_id,
        up.blueprint_creation_count as old_creation,
        up.blueprint_saving_count as old_saving,
        get_actual_blueprint_creation_count(up.user_id) as new_creation,
        get_actual_blueprint_saving_count(up.user_id) as new_saving
      FROM public.user_profiles up
      WHERE up.user_id = p_user_id
    )
    SELECT
      ac.user_id,
      ac.old_creation,
      ac.new_creation,
      ac.old_saving,
      ac.new_saving,
      (ac.old_creation = ac.new_creation AND ac.old_saving = ac.new_saving) as matched
    FROM actual_counts ac;

    -- Update the counters
    UPDATE public.user_profiles up
    SET
      blueprint_creation_count = get_actual_blueprint_creation_count(up.user_id),
      blueprint_saving_count = get_actual_blueprint_saving_count(up.user_id),
      updated_at = NOW()
    WHERE up.user_id = p_user_id;
  ELSE
    -- Sync all users
    RETURN QUERY
    WITH actual_counts AS (
      SELECT
        up.user_id,
        up.blueprint_creation_count as old_creation,
        up.blueprint_saving_count as old_saving,
        get_actual_blueprint_creation_count(up.user_id) as new_creation,
        get_actual_blueprint_saving_count(up.user_id) as new_saving
      FROM public.user_profiles up
    )
    SELECT
      ac.user_id,
      ac.old_creation,
      ac.new_creation,
      ac.old_saving,
      ac.new_saving,
      (ac.old_creation = ac.new_creation AND ac.old_saving = ac.new_saving) as matched
    FROM actual_counts ac
    WHERE ac.old_creation != ac.new_creation OR ac.old_saving != ac.new_saving;

    -- Update the counters for all users
    UPDATE public.user_profiles up
    SET
      blueprint_creation_count = get_actual_blueprint_creation_count(up.user_id),
      blueprint_saving_count = get_actual_blueprint_saving_count(up.user_id),
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_blueprint_counters IS
'Admin function to sync counter columns with actual database counts. Can sync single user or all users.';

-- ============================================================================
-- 8. Create indexes for performance
-- ============================================================================

-- Index for counting blueprints by user (improves count query performance)
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_user_status
ON public.blueprint_generator(user_id, status, created_at);

-- Index for counting completed blueprints (improves saving count performance)
CREATE INDEX IF NOT EXISTS idx_blueprint_generator_completed
ON public.blueprint_generator(user_id, status)
WHERE status = 'completed' AND blueprint_json IS NOT NULL;

-- ============================================================================
-- 9. Sync existing counters with actual data
-- ============================================================================

-- Run sync for all users to ensure counters match reality
DO $$
DECLARE
  v_sync_results RECORD;
  v_total_synced INTEGER := 0;
BEGIN
  FOR v_sync_results IN
    SELECT * FROM sync_blueprint_counters()
  LOOP
    v_total_synced := v_total_synced + 1;

    IF NOT v_sync_results.counters_matched THEN
      RAISE NOTICE 'Synced user %: creation % -> %, saving % -> %',
        v_sync_results.user_id,
        v_sync_results.old_creation_count,
        v_sync_results.new_creation_count,
        v_sync_results.old_saving_count,
        v_sync_results.new_saving_count;
    END IF;
  END LOOP;

  IF v_total_synced > 0 THEN
    RAISE NOTICE 'Synced % users with mismatched counters', v_total_synced;
  ELSE
    RAISE NOTICE 'All user counters already in sync';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Usage Examples
-- ============================================================================

-- Example 1: Get actual blueprint counts for a user
-- SELECT
--   get_actual_blueprint_creation_count('user-uuid'::UUID) as total_created,
--   get_actual_blueprint_saving_count('user-uuid'::UUID) as total_saved;

-- Example 2: Get effective limits (now uses actual counts)
-- SELECT * FROM get_effective_limits('user-uuid'::UUID);

-- Example 3: Sync counters for specific user
-- SELECT * FROM sync_blueprint_counters('user-uuid'::UUID);

-- Example 4: Find users with mismatched counters
-- SELECT * FROM sync_blueprint_counters();

-- Example 5: Verify a user's counts match
-- SELECT
--   up.user_id,
--   up.blueprint_creation_count as stored_creation,
--   get_actual_blueprint_creation_count(up.user_id) as actual_creation,
--   up.blueprint_saving_count as stored_saving,
--   get_actual_blueprint_saving_count(up.user_id) as actual_saving
-- FROM public.user_profiles up
-- WHERE up.user_id = 'user-uuid'::UUID;
