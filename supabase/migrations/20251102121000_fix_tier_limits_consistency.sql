-- Migration: Fix Tier Limits Consistency
-- Description: Standardize tier limits across all database functions and user_profiles table
-- Date: 2025-11-02
--
-- This migration resolves conflicts found in the tier limits audit:
-- 1. Voyager tier: Standardize to 50/50 (was inconsistent: 40 in some functions, 50 in others)
-- 2. Explorer tier: Standardize all users to 5/5 (some had 2)
-- 3. Free tier: Standardize all users to 2/2 (some had 3)
-- 4. Update all database functions to use consistent limits

-- ============================================================================
-- STEP 1: Update user_profiles table to fix inconsistent data
-- ============================================================================

-- Fix explorer tier users (should be 5/5)
UPDATE user_profiles
SET
  blueprint_creation_limit = 5,
  blueprint_saving_limit = 5,
  updated_at = NOW()
WHERE subscription_tier = 'explorer'
  AND (blueprint_creation_limit != 5 OR blueprint_saving_limit != 5);

-- Fix free tier users (should be 2/2)
UPDATE user_profiles
SET
  blueprint_creation_limit = 2,
  blueprint_saving_limit = 2,
  updated_at = NOW()
WHERE subscription_tier = 'free'
  AND (blueprint_creation_limit != 2 OR blueprint_saving_limit != 2);

-- Fix voyager tier users (standardize to 50/50)
UPDATE user_profiles
SET
  blueprint_creation_limit = 50,
  blueprint_saving_limit = 50,
  updated_at = NOW()
WHERE subscription_tier = 'voyager'
  AND (blueprint_creation_limit != 50 OR blueprint_saving_limit != 50);

-- Fix navigator tier users (should be 25/25)
UPDATE user_profiles
SET
  blueprint_creation_limit = 25,
  blueprint_saving_limit = 25,
  updated_at = NOW()
WHERE subscription_tier = 'navigator'
  AND (blueprint_creation_limit != 25 OR blueprint_saving_limit != 25);

-- Fix crew tier users (should be 10/10)
UPDATE user_profiles
SET
  blueprint_creation_limit = 10,
  blueprint_saving_limit = 10,
  updated_at = NOW()
WHERE subscription_tier = 'crew'
  AND (blueprint_creation_limit != 10 OR blueprint_saving_limit != 10);

-- Fix fleet tier users (should be 30/30)
UPDATE user_profiles
SET
  blueprint_creation_limit = 30,
  blueprint_saving_limit = 30,
  updated_at = NOW()
WHERE subscription_tier = 'fleet'
  AND (blueprint_creation_limit != 30 OR blueprint_saving_limit != 30);

-- Fix armada tier users (should be 60/60)
UPDATE user_profiles
SET
  blueprint_creation_limit = 60,
  blueprint_saving_limit = 60,
  updated_at = NOW()
WHERE subscription_tier = 'armada'
  AND (blueprint_creation_limit != 60 OR blueprint_saving_limit != 60);

-- ============================================================================
-- STEP 2: Update database functions to use consistent limits
-- ============================================================================

-- Function: check_blueprint_creation_limit
-- Fix voyager tier from 40 to 50
CREATE OR REPLACE FUNCTION check_blueprint_creation_limit(p_user_id UUID)
RETURNS TABLE (
  can_create BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_subscription_tier TEXT;
  v_user_role TEXT;
  v_current_count INTEGER;
  v_limit_count INTEGER;
BEGIN
  -- Get user subscription tier and role
  SELECT subscription_tier, user_role INTO v_subscription_tier, v_user_role
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Developers and admins have unlimited access
  IF v_user_role IN ('developer', 'admin') THEN
    RETURN QUERY SELECT TRUE, 0, -1, 'Unlimited access for developers and admins'::TEXT;
    RETURN;
  END IF;

  -- Get tier limits (FIXED: voyager now 50)
  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 50
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  -- Count non-soft-deleted blueprints created this month
  SELECT COUNT(*)
  INTO v_current_count
  FROM blueprint_generator
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP);

  -- Check if user can create more
  IF v_current_count >= v_limit_count THEN
    RETURN QUERY SELECT
      FALSE,
      v_current_count,
      v_limit_count,
      format('Blueprint creation limit reached. You have created %s/%s blueprints this month.', v_current_count, v_limit_count)::TEXT;
  ELSE
    RETURN QUERY SELECT
      TRUE,
      v_current_count,
      v_limit_count,
      format('You can create %s more blueprints this month.', v_limit_count - v_current_count)::TEXT;
  END IF;
END;
$$;

-- Function: check_blueprint_saving_limit
-- Fix voyager tier from 40 to 50
CREATE OR REPLACE FUNCTION check_blueprint_saving_limit(p_user_id UUID)
RETURNS TABLE (
  can_save BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_subscription_tier TEXT;
  v_user_role TEXT;
  v_current_count INTEGER;
  v_limit_count INTEGER;
BEGIN
  -- Get user subscription tier and role
  SELECT subscription_tier, user_role INTO v_subscription_tier, v_user_role
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Developers and admins have unlimited access
  IF v_user_role IN ('developer', 'admin') THEN
    RETURN QUERY SELECT TRUE, 0, -1, 'Unlimited access for developers and admins'::TEXT;
    RETURN;
  END IF;

  -- Get tier limits (FIXED: voyager now 50)
  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 50
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  -- Count non-soft-deleted saved blueprints
  SELECT COUNT(*)
  INTO v_current_count
  FROM blueprint_generator
  WHERE user_id = p_user_id
    AND status IN ('completed', 'generating')
    AND (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP);

  -- Check if user can save more
  IF v_current_count >= v_limit_count THEN
    RETURN QUERY SELECT
      FALSE,
      v_current_count,
      v_limit_count,
      format('Blueprint saving limit reached. You have saved %s/%s blueprints.', v_current_count, v_limit_count)::TEXT;
  ELSE
    RETURN QUERY SELECT
      TRUE,
      v_current_count,
      v_limit_count,
      format('You can save %s more blueprints.', v_limit_count - v_current_count)::TEXT;
  END IF;
END;
$$;

-- Function: get_user_tier_limits
-- Fix voyager tier from 40 to 50
CREATE OR REPLACE FUNCTION get_user_tier_limits(p_user_id UUID)
RETURNS TABLE (
  blueprint_creation_limit INTEGER,
  blueprint_saving_limit INTEGER,
  subscription_tier TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_subscription_tier TEXT;
BEGIN
  -- Get the user's subscription tier
  SELECT user_profiles.subscription_tier INTO v_subscription_tier
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Return limits based on tier (FIXED: voyager now 50)
  RETURN QUERY SELECT
    CASE v_subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END AS blueprint_creation_limit,
    CASE v_subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END AS blueprint_saving_limit,
    v_subscription_tier;
END;
$$;

-- Trigger Function: update_user_tier_limits
-- Fix voyager tier from 40 to 50
CREATE OR REPLACE FUNCTION update_user_tier_limits()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only update limits if subscription_tier has changed
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    NEW.blueprint_creation_limit := CASE NEW.subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END;

    NEW.blueprint_saving_limit := CASE NEW.subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger Function: sync_subscription_to_user_profile
-- Fix voyager tier from mixed values to 50
CREATE OR REPLACE FUNCTION sync_subscription_to_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_blueprint_limit INTEGER;
BEGIN
  -- Determine blueprint limit based on subscription tier (FIXED: voyager now 50)
  v_blueprint_limit := CASE NEW.subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 50
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  -- Update user_profiles when subscription becomes active
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    UPDATE public.user_profiles
    SET
      subscription_tier = NEW.subscription_tier,
      user_role = NEW.subscription_tier,
      blueprint_creation_limit = v_blueprint_limit,
      blueprint_saving_limit = v_blueprint_limit,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Downgrade to free tier when subscription is cancelled/expired/completed
  IF NEW.status IN ('cancelled', 'expired', 'completed')
     AND (OLD IS NULL OR OLD.status NOT IN ('cancelled', 'expired', 'completed')) THEN
    UPDATE public.user_profiles
    SET
      subscription_tier = 'explorer',
      user_role = 'explorer',
      blueprint_creation_limit = 2,
      blueprint_saving_limit = 2,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION check_blueprint_creation_limit(UUID) IS
'Checks if user can create more blueprints based on their tier limits.
Tier limits (creation/saving):
- free: 2/2
- explorer: 5/5
- navigator: 25/25
- voyager: 50/50
- crew: 10/10 (per seat)
- fleet: 30/30 (per seat)
- armada: 60/60 (per seat)
- developer/admin: unlimited (-1)';

COMMENT ON FUNCTION check_blueprint_saving_limit(UUID) IS
'Checks if user can save more blueprints based on their tier limits.
Uses same limits as creation. See check_blueprint_creation_limit for details.';

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
