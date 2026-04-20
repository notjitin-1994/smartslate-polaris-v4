-- Rollback Migration: ROLLBACK_20251028000000_implement_monthly_rollover_limits.sql
-- Description: Rollback monthly rollover tracking implementation
-- Author: System
-- Date: 2025-10-28
--
-- WARNING: This will remove all rollover tracking data.
-- Only run this if you need to revert the monthly rollover system.

BEGIN;

-- ============================================================================
-- 1. Drop new functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.reset_all_monthly_limits();
DROP FUNCTION IF EXISTS public.handle_tier_upgrade(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_effective_limits(UUID);
DROP FUNCTION IF EXISTS public.reset_monthly_limits(UUID);
DROP FUNCTION IF EXISTS public.should_reset_monthly_limits(UUID);

-- ============================================================================
-- 2. Restore original functions (from 20251025030000_fix_tier_limits_migration.sql)
-- ============================================================================

-- Restore get_user_limits
CREATE OR REPLACE FUNCTION public.get_user_limits(p_user_id UUID)
RETURNS TABLE(
  role TEXT,
  tier TEXT,
  max_generations_monthly INTEGER,
  max_saved_starmaps INTEGER,
  current_generations INTEGER,
  current_saved_starmaps INTEGER,
  generations_remaining INTEGER,
  saved_remaining INTEGER,
  is_exempt BOOLEAN
) AS $$
DECLARE
  v_user_role TEXT;
  v_subscription_tier TEXT;
  v_is_exempt BOOLEAN;
  v_current_generations INTEGER;
  v_current_saved INTEGER;
BEGIN
  SELECT
    up.user_role,
    up.subscription_tier,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean,
    COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0),
    COALESCE((up.subscription_metadata #>> '{usage,saved_starmaps}')::INTEGER, 0)
  INTO v_user_role, v_subscription_tier, v_is_exempt, v_current_generations, v_current_saved
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN QUERY SELECT
      'user'::TEXT,
      'free'::TEXT,
      2, 2, 0, 0, 2, 2, false;
    RETURN;
  END IF;

  IF v_user_role = 'developer' OR v_is_exempt = true THEN
    RETURN QUERY SELECT
      v_user_role,
      v_subscription_tier,
      -1,
      -1,
      v_current_generations,
      v_current_saved,
      -1,
      -1,
      true;
  ELSE
    RETURN QUERY
    SELECT
      v_user_role,
      v_subscription_tier,
      CASE v_subscription_tier
        WHEN 'free' THEN 2
        WHEN 'explorer' THEN 5
        WHEN 'navigator' THEN 20
        WHEN 'voyager' THEN 40
        WHEN 'crew' THEN 10
        WHEN 'fleet' THEN 30
        WHEN 'armada' THEN 60
        ELSE 2
      END AS max_generations_monthly,
      CASE v_subscription_tier
        WHEN 'free' THEN 2
        WHEN 'explorer' THEN 5
        WHEN 'navigator' THEN 20
        WHEN 'voyager' THEN 40
        WHEN 'crew' THEN 10
        WHEN 'fleet' THEN 30
        WHEN 'armada' THEN 60
        ELSE 2
      END AS max_saved_starmaps,
      v_current_generations AS current_generations,
      v_current_saved AS current_saved_starmaps,
      GREATEST(0,
        CASE v_subscription_tier
          WHEN 'free' THEN 2
          WHEN 'explorer' THEN 5
          WHEN 'navigator' THEN 20
          WHEN 'voyager' THEN 40
          WHEN 'crew' THEN 10
          WHEN 'fleet' THEN 30
          WHEN 'armada' THEN 60
          ELSE 2
        END - v_current_generations
      ) AS generations_remaining,
      GREATEST(0,
        CASE v_subscription_tier
          WHEN 'free' THEN 2
          WHEN 'explorer' THEN 5
          WHEN 'navigator' THEN 20
          WHEN 'voyager' THEN 40
          WHEN 'crew' THEN 10
          WHEN 'fleet' THEN 30
          WHEN 'armada' THEN 60
          ELSE 2
        END - v_current_saved
      ) AS saved_remaining,
      false AS is_exempt;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore check_blueprint_creation_limits
CREATE OR REPLACE FUNCTION public.check_blueprint_creation_limits(p_user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_user_role TEXT;
  v_subscription_tier TEXT;
  v_current_count INTEGER;
  v_limit_count INTEGER;
  v_is_exempt BOOLEAN;
BEGIN
  SELECT
    up.user_role,
    up.subscription_tier,
    up.blueprint_creation_count,
    up.blueprint_creation_limit,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO v_user_role, v_subscription_tier, v_current_count, v_limit_count, v_is_exempt
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN QUERY SELECT false, 0, 2, 0, 'User not found';
    RETURN;
  END IF;

  IF v_user_role = 'developer' OR v_is_exempt = true THEN
    RETURN QUERY SELECT true, v_current_count, -1, -1, 'Unlimited access (Developer)';
    RETURN;
  END IF;

  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 20
    WHEN 'voyager' THEN 40
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  IF v_current_count < v_limit_count THEN
    RETURN QUERY SELECT
      true,
      v_current_count,
      v_limit_count,
      v_limit_count - v_current_count,
      'Blueprint creation allowed';
  ELSE
    RETURN QUERY SELECT
      false,
      v_current_count,
      v_limit_count,
      0,
      'You''ve reached your limit of ' || v_limit_count || ' blueprint creations. Upgrade your subscription to create more.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore check_blueprint_saving_limits
CREATE OR REPLACE FUNCTION public.check_blueprint_saving_limits(p_user_id UUID)
RETURNS TABLE(
  can_save BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_user_role TEXT;
  v_subscription_tier TEXT;
  v_current_count INTEGER;
  v_limit_count INTEGER;
  v_is_exempt BOOLEAN;
BEGIN
  SELECT
    up.user_role,
    up.subscription_tier,
    up.blueprint_saving_count,
    up.blueprint_saving_limit,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO v_user_role, v_subscription_tier, v_current_count, v_limit_count, v_is_exempt
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  IF v_user_role IS NULL THEN
    RETURN QUERY SELECT false, 0, 2, 0, 'User not found';
    RETURN;
  END IF;

  IF v_user_role = 'developer' OR v_is_exempt = true THEN
    RETURN QUERY SELECT true, v_current_count, -1, -1, 'Unlimited access (Developer)';
    RETURN;
  END IF;

  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 20
    WHEN 'voyager' THEN 40
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  IF v_current_count < v_limit_count THEN
    RETURN QUERY SELECT
      true,
      v_current_count,
      v_limit_count,
      v_limit_count - v_current_count,
      'Blueprint saving allowed';
  ELSE
    RETURN QUERY SELECT
      false,
      v_current_count,
      v_limit_count,
      0,
      'You''ve reached your limit of ' || v_limit_count || ' blueprint saves. Upgrade your subscription to save more.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore increment functions (from 0027_add_blueprint_usage_tracking.sql)
CREATE OR REPLACE FUNCTION increment_blueprint_creation_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  is_exempt BOOLEAN;
BEGIN
  SELECT (blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO is_exempt
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF is_exempt THEN
    UPDATE user_profiles
    SET
      blueprint_creation_count = blueprint_creation_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_created}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  SELECT blueprint_creation_count, blueprint_creation_limit
  INTO current_count, limit_count
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF current_count >= limit_count THEN
    RETURN FALSE;
  END IF;

  UPDATE user_profiles
  SET
    blueprint_creation_count = blueprint_creation_count + 1,
    blueprint_usage_metadata = jsonb_set(
      blueprint_usage_metadata,
      '{last_blueprint_created}',
      to_jsonb(NOW())
    )
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_blueprint_saving_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  is_exempt BOOLEAN;
BEGIN
  SELECT (blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO is_exempt
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF is_exempt THEN
    UPDATE user_profiles
    SET
      blueprint_saving_count = blueprint_saving_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  SELECT blueprint_saving_count, blueprint_saving_limit
  INTO current_count, limit_count
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF current_count >= limit_count THEN
    RETURN FALSE;
  END IF;

  UPDATE user_profiles
  SET
    blueprint_saving_count = blueprint_saving_count + 1,
    blueprint_usage_metadata = jsonb_set(
      blueprint_usage_metadata,
      '{last_blueprint_saved}',
      to_jsonb(NOW())
      )
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Drop indexes created by migration
-- ============================================================================

DROP INDEX IF EXISTS public.idx_user_profiles_billing_dates;

-- ============================================================================
-- 4. Remove new columns from user_profiles
-- ============================================================================

ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS billing_cycle_start_date;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS next_billing_cycle_date;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS upgraded_from_free_tier;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS free_tier_carryover_expires_at;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS free_tier_carryover_data;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS rollover_history;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS current_month_creation_count;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS current_month_saving_count;

COMMIT;

-- ============================================================================
-- Note: After rollback, you may need to manually reset usage counters
-- ============================================================================

-- To reset all user counts to zero (optional):
-- UPDATE public.user_profiles
-- SET
--   blueprint_creation_count = 0,
--   blueprint_saving_count = 0;
