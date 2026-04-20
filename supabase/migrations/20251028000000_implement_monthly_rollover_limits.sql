-- Migration: 20251028000000_implement_monthly_rollover_limits.sql
-- Description: Implement monthly rollover tracking for blueprint limits
-- Author: System
-- Date: 2025-10-28
--
-- This migration implements a comprehensive rollover system:
-- 1. Free tier: Lifetime limits (no resets)
-- 2. Paid tiers: Monthly limits with 12-month rollover
-- 3. Free→Paid upgrade: Carryover free tier usage for 12 months
-- 4. Automatic monthly reset for paid tiers

BEGIN;

-- ============================================================================
-- 1. Add new columns to user_profiles for rollover tracking
-- ============================================================================

DO $$
BEGIN
  -- Billing cycle start date (when the current billing period began)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'billing_cycle_start_date'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN billing_cycle_start_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Next billing cycle date (when limits will reset)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'next_billing_cycle_date'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN next_billing_cycle_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');
  END IF;

  -- Track if user was upgraded from free tier (to enable carryover)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'upgraded_from_free_tier'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN upgraded_from_free_tier BOOLEAN DEFAULT FALSE;
  END IF;

  -- Free tier carryover date (when carryover expires - 12 months from upgrade)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'free_tier_carryover_expires_at'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN free_tier_carryover_expires_at TIMESTAMPTZ;
  END IF;

  -- Free tier carryover amounts (how much from free tier to add)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'free_tier_carryover_data'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN free_tier_carryover_data JSONB DEFAULT '{
      "creation_carryover": 0,
      "saving_carryover": 0,
      "initial_free_creation_count": 0,
      "initial_free_saving_count": 0
    }'::jsonb;
  END IF;

  -- Rollover history (last 12 months of usage tracking)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'rollover_history'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN rollover_history JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Current month's creation count (resets monthly for paid tiers)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'current_month_creation_count'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN current_month_creation_count INTEGER DEFAULT 0;
  END IF;

  -- Current month's saving count (resets monthly for paid tiers)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'current_month_saving_count'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN current_month_saving_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_billing_dates
ON public.user_profiles(next_billing_cycle_date, subscription_tier);

-- ============================================================================
-- 2. Initialize existing users with proper defaults
-- ============================================================================

-- Set billing cycle dates for existing users
UPDATE public.user_profiles
SET
  billing_cycle_start_date = COALESCE(billing_cycle_start_date, created_at),
  next_billing_cycle_date = COALESCE(
    next_billing_cycle_date,
    (COALESCE(created_at, NOW()) + INTERVAL '1 month')
  ),
  current_month_creation_count = COALESCE(blueprint_creation_count, 0),
  current_month_saving_count = COALESCE(blueprint_saving_count, 0)
WHERE billing_cycle_start_date IS NULL
   OR next_billing_cycle_date IS NULL;

-- ============================================================================
-- 3. Function: Check if user needs monthly reset
-- ============================================================================

CREATE OR REPLACE FUNCTION should_reset_monthly_limits(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_next_billing_date TIMESTAMPTZ;
  v_subscription_tier TEXT;
BEGIN
  SELECT next_billing_cycle_date, subscription_tier
  INTO v_next_billing_date, v_subscription_tier
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Free tier never resets (lifetime limits)
  IF v_subscription_tier = 'free' THEN
    RETURN FALSE;
  END IF;

  -- Check if we've passed the next billing cycle date
  RETURN NOW() >= v_next_billing_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Function: Perform monthly reset and rollover
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_limits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_subscription_tier TEXT;
  v_current_creation_count INTEGER;
  v_current_saving_count INTEGER;
  v_rollover_history JSONB;
  v_next_billing_date TIMESTAMPTZ;
  v_upgraded_from_free BOOLEAN;
  v_free_tier_expires_at TIMESTAMPTZ;
BEGIN
  -- Get current user data
  SELECT
    subscription_tier,
    current_month_creation_count,
    current_month_saving_count,
    rollover_history,
    next_billing_cycle_date,
    upgraded_from_free_tier,
    free_tier_carryover_expires_at
  INTO
    v_subscription_tier,
    v_current_creation_count,
    v_current_saving_count,
    v_rollover_history,
    v_next_billing_date,
    v_upgraded_from_free,
    v_free_tier_expires_at
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Don't reset free tier (lifetime limits)
  IF v_subscription_tier = 'free' THEN
    RETURN;
  END IF;

  -- Add current month's data to rollover history
  v_rollover_history := (
    SELECT jsonb_agg(element)
    FROM (
      -- Add current month's record
      SELECT jsonb_build_object(
        'month', TO_CHAR(v_next_billing_date - INTERVAL '1 month', 'YYYY-MM'),
        'creation_count', COALESCE(v_current_creation_count, 0),
        'saving_count', COALESCE(v_current_saving_count, 0),
        'billing_cycle_end', v_next_billing_date
      )
      UNION ALL
      -- Keep last 11 months from existing history (total 12 months)
      SELECT element
      FROM jsonb_array_elements(COALESCE(v_rollover_history, '[]'::jsonb))
      ORDER BY (element->>'billing_cycle_end')::TIMESTAMPTZ DESC
      LIMIT 11
    ) AS combined
  );

  -- Check if free tier carryover has expired
  IF v_upgraded_from_free AND v_free_tier_expires_at IS NOT NULL THEN
    IF NOW() >= v_free_tier_expires_at THEN
      -- Carryover expired, reset the flag and data
      UPDATE public.user_profiles
      SET
        upgraded_from_free_tier = FALSE,
        free_tier_carryover_data = '{
          "creation_carryover": 0,
          "saving_carryover": 0,
          "initial_free_creation_count": 0,
          "initial_free_saving_count": 0
        }'::jsonb,
        free_tier_carryover_expires_at = NULL
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- Reset monthly counts and update billing dates
  UPDATE public.user_profiles
  SET
    current_month_creation_count = 0,
    current_month_saving_count = 0,
    rollover_history = v_rollover_history,
    billing_cycle_start_date = v_next_billing_date,
    next_billing_cycle_date = v_next_billing_date + INTERVAL '1 month',
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Function: Calculate effective limits (with rollover and carryover)
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
  v_current_creation_count INTEGER;
  v_current_saving_count INTEGER;
  v_upgraded_from_free BOOLEAN;
  v_free_tier_expires_at TIMESTAMPTZ;
  v_free_tier_carryover JSONB;
  v_creation_carryover INTEGER := 0;
  v_saving_carryover INTEGER := 0;
  v_is_exempt BOOLEAN;
BEGIN
  -- Get user data
  SELECT
    up.subscription_tier,
    up.user_role,
    up.blueprint_creation_limit,
    up.blueprint_saving_limit,
    up.current_month_creation_count,
    up.current_month_saving_count,
    up.upgraded_from_free_tier,
    up.free_tier_carryover_expires_at,
    up.free_tier_carryover_data,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO
    v_subscription_tier,
    v_user_role,
    v_base_creation_limit,
    v_base_saving_limit,
    v_current_creation_count,
    v_current_saving_count,
    v_upgraded_from_free,
    v_free_tier_expires_at,
    v_free_tier_carryover,
    v_is_exempt
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  -- Check if monthly reset is needed
  IF should_reset_monthly_limits(p_user_id) THEN
    PERFORM reset_monthly_limits(p_user_id);

    -- Reload data after reset
    SELECT
      up.current_month_creation_count,
      up.current_month_saving_count
    INTO
      v_current_creation_count,
      v_current_saving_count
    FROM public.user_profiles up
    WHERE up.user_id = p_user_id;
  END IF;

  -- Developer role has unlimited access
  IF v_user_role = 'developer' OR v_is_exempt = TRUE THEN
    RETURN QUERY SELECT -1, -1, v_current_creation_count, v_current_saving_count, -1, -1;
    RETURN;
  END IF;

  -- Check for valid free tier carryover
  IF v_upgraded_from_free AND v_free_tier_expires_at IS NOT NULL AND NOW() < v_free_tier_expires_at THEN
    v_creation_carryover := COALESCE((v_free_tier_carryover->>'creation_carryover')::INTEGER, 0);
    v_saving_carryover := COALESCE((v_free_tier_carryover->>'saving_carryover')::INTEGER, 0);
  END IF;

  -- Free tier uses cumulative counts (lifetime limits)
  IF v_subscription_tier = 'free' THEN
    RETURN QUERY SELECT
      v_base_creation_limit,
      v_base_saving_limit,
      COALESCE(v_current_creation_count, 0),
      COALESCE(v_current_saving_count, 0),
      GREATEST(0, v_base_creation_limit - COALESCE(v_current_creation_count, 0)),
      GREATEST(0, v_base_saving_limit - COALESCE(v_current_saving_count, 0));
  ELSE
    -- Paid tiers use monthly counts + carryover
    RETURN QUERY SELECT
      v_base_creation_limit + v_creation_carryover,
      v_base_saving_limit + v_saving_carryover,
      COALESCE(v_current_creation_count, 0),
      COALESCE(v_current_saving_count, 0),
      GREATEST(0, (v_base_creation_limit + v_creation_carryover) - COALESCE(v_current_creation_count, 0)),
      GREATEST(0, (v_base_saving_limit + v_saving_carryover) - COALESCE(v_current_saving_count, 0));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Update: check_blueprint_creation_limits (with rollover support)
-- ============================================================================

DROP FUNCTION IF EXISTS public.check_blueprint_creation_limits(UUID);

CREATE OR REPLACE FUNCTION public.check_blueprint_creation_limits(p_user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_limits RECORD;
BEGIN
  -- Get effective limits (handles reset and carryover automatically)
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Developer/exempt users have unlimited access
  IF v_limits.creation_limit = -1 THEN
    RETURN QUERY SELECT true, v_limits.creation_used, -1, -1, 'Unlimited access (Developer)';
    RETURN;
  END IF;

  -- Check if user can create more blueprints
  IF v_limits.creation_used < v_limits.creation_limit THEN
    RETURN QUERY SELECT
      true,
      v_limits.creation_used,
      v_limits.creation_limit,
      v_limits.creation_available,
      'Blueprint creation allowed';
  ELSE
    RETURN QUERY SELECT
      false,
      v_limits.creation_used,
      v_limits.creation_limit,
      0,
      'You''ve reached your limit of ' || v_limits.creation_limit || ' blueprint creations this month. Upgrade your subscription to create more.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Update: check_blueprint_saving_limits (with rollover support)
-- ============================================================================

DROP FUNCTION IF EXISTS public.check_blueprint_saving_limits(UUID);

CREATE OR REPLACE FUNCTION public.check_blueprint_saving_limits(p_user_id UUID)
RETURNS TABLE(
  can_save BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_limits RECORD;
BEGIN
  -- Get effective limits (handles reset and carryover automatically)
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Developer/exempt users have unlimited access
  IF v_limits.saving_limit = -1 THEN
    RETURN QUERY SELECT true, v_limits.saving_used, -1, -1, 'Unlimited access (Developer)';
    RETURN;
  END IF;

  -- Check if user can save more blueprints
  IF v_limits.saving_used < v_limits.saving_limit THEN
    RETURN QUERY SELECT
      true,
      v_limits.saving_used,
      v_limits.saving_limit,
      v_limits.saving_available,
      'Blueprint saving allowed';
  ELSE
    RETURN QUERY SELECT
      false,
      v_limits.saving_used,
      v_limits.saving_limit,
      0,
      'You''ve reached your limit of ' || v_limits.saving_limit || ' blueprint saves. Upgrade your subscription to save more.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Update: increment_blueprint_creation_count (with rollover support)
-- ============================================================================

DROP FUNCTION IF EXISTS public.increment_blueprint_creation_count(UUID);

CREATE OR REPLACE FUNCTION public.increment_blueprint_creation_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
  v_subscription_tier TEXT;
BEGIN
  -- Get effective limits
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Exempt users can always create
  IF v_limits.creation_limit = -1 THEN
    -- Still increment counter for tracking purposes
    UPDATE public.user_profiles
    SET
      current_month_creation_count = current_month_creation_count + 1,
      blueprint_creation_count = blueprint_creation_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_created}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check if limit would be exceeded
  IF v_limits.creation_used >= v_limits.creation_limit THEN
    RETURN FALSE;
  END IF;

  -- Get tier to determine which counter to increment
  SELECT subscription_tier INTO v_subscription_tier
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Increment counters
  IF v_subscription_tier = 'free' THEN
    -- Free tier: increment cumulative count only
    UPDATE public.user_profiles
    SET
      blueprint_creation_count = blueprint_creation_count + 1,
      current_month_creation_count = blueprint_creation_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_created}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
  ELSE
    -- Paid tier: increment both monthly and cumulative counts
    UPDATE public.user_profiles
    SET
      current_month_creation_count = current_month_creation_count + 1,
      blueprint_creation_count = blueprint_creation_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_created}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Update: increment_blueprint_saving_count (with rollover support)
-- ============================================================================

DROP FUNCTION IF EXISTS public.increment_blueprint_saving_count(UUID);

CREATE OR REPLACE FUNCTION public.increment_blueprint_saving_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
  v_subscription_tier TEXT;
BEGIN
  -- Get effective limits
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Exempt users can always save
  IF v_limits.saving_limit = -1 THEN
    -- Still increment counter for tracking purposes
    UPDATE public.user_profiles
    SET
      current_month_saving_count = current_month_saving_count + 1,
      blueprint_saving_count = blueprint_saving_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check if limit would be exceeded
  IF v_limits.saving_used >= v_limits.saving_limit THEN
    RETURN FALSE;
  END IF;

  -- Get tier to determine which counter to increment
  SELECT subscription_tier INTO v_subscription_tier
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Increment counters
  IF v_subscription_tier = 'free' THEN
    -- Free tier: increment cumulative count only
    UPDATE public.user_profiles
    SET
      blueprint_saving_count = blueprint_saving_count + 1,
      current_month_saving_count = blueprint_saving_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
  ELSE
    -- Paid tier: increment both monthly and cumulative counts
    UPDATE public.user_profiles
    SET
      current_month_saving_count = current_month_saving_count + 1,
      blueprint_saving_count = blueprint_saving_count + 1,
      blueprint_usage_metadata = jsonb_set(
        blueprint_usage_metadata,
        '{last_blueprint_saved}',
        to_jsonb(NOW())
      )
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. Function: Handle tier upgrade (from free to paid)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_tier_upgrade(
  p_user_id UUID,
  p_new_tier TEXT
)
RETURNS VOID AS $$
DECLARE
  v_old_tier TEXT;
  v_current_creation_count INTEGER;
  v_current_saving_count INTEGER;
  v_creation_carryover INTEGER;
  v_saving_carryover INTEGER;
BEGIN
  -- Get current tier and usage
  SELECT
    subscription_tier,
    blueprint_creation_count,
    blueprint_saving_count
  INTO
    v_old_tier,
    v_current_creation_count,
    v_current_saving_count
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Only process if upgrading FROM free tier TO a paid tier
  IF v_old_tier = 'free' AND p_new_tier != 'free' THEN
    -- Calculate carryover: max of (2 - used, 0) = unused free tier allowance
    v_creation_carryover := GREATEST(0, 2 - COALESCE(v_current_creation_count, 0));
    v_saving_carryover := GREATEST(0, 2 - COALESCE(v_current_saving_count, 0));

    -- Set upgrade flag and carryover data (expires in 12 months)
    UPDATE public.user_profiles
    SET
      upgraded_from_free_tier = TRUE,
      free_tier_carryover_expires_at = NOW() + INTERVAL '12 months',
      free_tier_carryover_data = jsonb_build_object(
        'creation_carryover', v_creation_carryover,
        'saving_carryover', v_saving_carryover,
        'initial_free_creation_count', v_current_creation_count,
        'initial_free_saving_count', v_current_saving_count,
        'upgrade_date', NOW()
      ),
      subscription_tier = p_new_tier,
      billing_cycle_start_date = NOW(),
      next_billing_cycle_date = NOW() + INTERVAL '1 month',
      current_month_creation_count = 0,
      current_month_saving_count = 0,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_new_tier != v_old_tier THEN
    -- Regular tier change (not from free)
    UPDATE public.user_profiles
    SET
      subscription_tier = p_new_tier,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. Scheduled job function: Reset all users who need monthly reset
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_all_monthly_limits()
RETURNS TABLE(
  users_processed INTEGER,
  users_reset INTEGER
) AS $$
DECLARE
  v_users_processed INTEGER := 0;
  v_users_reset INTEGER := 0;
  v_user_record RECORD;
BEGIN
  -- Find all paid-tier users whose billing cycle has passed
  FOR v_user_record IN
    SELECT user_id, subscription_tier
    FROM public.user_profiles
    WHERE subscription_tier != 'free'
      AND next_billing_cycle_date <= NOW()
  LOOP
    v_users_processed := v_users_processed + 1;

    -- Perform reset for this user
    PERFORM reset_monthly_limits(v_user_record.user_id);
    v_users_reset := v_users_reset + 1;
  END LOOP;

  RETURN QUERY SELECT v_users_processed, v_users_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. Update: get_user_limits (with rollover support)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_limits(UUID);

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
  is_exempt BOOLEAN,
  has_free_tier_carryover BOOLEAN,
  carryover_expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_role TEXT;
  v_subscription_tier TEXT;
  v_is_exempt BOOLEAN;
  v_limits RECORD;
  v_upgraded_from_free BOOLEAN;
  v_carryover_expires TIMESTAMPTZ;
BEGIN
  -- Get user info
  SELECT
    up.user_role,
    up.subscription_tier,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean,
    up.upgraded_from_free_tier,
    up.free_tier_carryover_expires_at
  INTO
    v_user_role,
    v_subscription_tier,
    v_is_exempt,
    v_upgraded_from_free,
    v_carryover_expires
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  -- Get effective limits
  SELECT * INTO v_limits FROM get_effective_limits(p_user_id);

  -- Check if free tier carryover is still active
  v_upgraded_from_free := v_upgraded_from_free
    AND v_carryover_expires IS NOT NULL
    AND NOW() < v_carryover_expires;

  -- Check if user is exempt
  IF v_user_role = 'developer' OR v_is_exempt = TRUE THEN
    RETURN QUERY SELECT
      v_user_role,
      v_subscription_tier,
      -1,
      -1,
      v_limits.creation_used,
      v_limits.saving_used,
      -1,
      -1,
      TRUE,
      v_upgraded_from_free,
      v_carryover_expires;
  ELSE
    RETURN QUERY SELECT
      v_user_role,
      v_subscription_tier,
      v_limits.creation_limit,
      v_limits.saving_limit,
      v_limits.creation_used,
      v_limits.saving_used,
      v_limits.creation_available,
      v_limits.saving_available,
      FALSE,
      v_upgraded_from_free,
      v_carryover_expires;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- Usage Examples and Verification
-- ============================================================================

-- Example 1: Check user's effective limits (handles auto-reset)
-- SELECT * FROM get_effective_limits('user-uuid'::UUID);

-- Example 2: Check if user can create blueprint
-- SELECT * FROM check_blueprint_creation_limits('user-uuid'::UUID);

-- Example 3: Upgrade user from free to navigator tier
-- SELECT handle_tier_upgrade('user-uuid'::UUID, 'navigator');

-- Example 4: Manual monthly reset for all users (run this as cron job)
-- SELECT * FROM reset_all_monthly_limits();

-- Example 5: Get comprehensive user limits info
-- SELECT * FROM get_user_limits('user-uuid'::UUID);
