-- Migration: Fix user profile column references in database functions
-- Date: 2025-10-29
-- Description: Fixes inconsistent column references in database functions
-- Bug: Functions were using 'id' instead of 'user_id' column name

-- ============================================================================
-- Fix the get_user_tier_limits function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_tier_limits(p_user_id UUID)
RETURNS TABLE (
  blueprint_creation_limit INTEGER,
  blueprint_saving_limit INTEGER,
  subscription_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_tier TEXT;
BEGIN
  -- Get the user's subscription tier - FIXED: use user_id instead of id
  SELECT user_profiles.subscription_tier INTO v_subscription_tier
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Return limits based on tier
  RETURN QUERY SELECT
    CASE v_subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 40
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END AS blueprint_creation_limit,
    CASE v_subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 40
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END AS blueprint_saving_limit,
    v_subscription_tier;
END;
$$;

-- ============================================================================
-- Fix the check_blueprint_creation_limit function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_blueprint_creation_limit(p_user_id UUID)
RETURNS TABLE (
  can_create BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_tier TEXT;
  v_user_role TEXT;
  v_current_count INTEGER;
  v_limit_count INTEGER;
BEGIN
  -- Get user subscription tier and role - FIXED: use user_id instead of id
  SELECT subscription_tier, user_role INTO v_subscription_tier, v_user_role
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Developers and admins have unlimited access
  IF v_user_role IN ('developer', 'admin') THEN
    RETURN QUERY SELECT TRUE, 0, -1, 'Unlimited access for developers and admins'::TEXT;
    RETURN;
  END IF;

  -- Get tier limits
  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 40
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

-- ============================================================================
-- Fix the check_blueprint_saving_limit function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_blueprint_saving_limit(p_user_id UUID)
RETURNS TABLE (
  can_save BOOLEAN,
  current_count INTEGER,
  limit_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_tier TEXT;
  v_user_role TEXT;
  v_current_count INTEGER;
  v_limit_count INTEGER;
BEGIN
  -- Get user subscription tier and role - FIXED: use user_id instead of id
  SELECT subscription_tier, user_role INTO v_subscription_tier, v_user_role
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Developers and admins have unlimited access
  IF v_user_role IN ('developer', 'admin') THEN
    RETURN QUERY SELECT TRUE, 0, -1, 'Unlimited access for developers and admins'::TEXT;
    RETURN;
  END IF;

  -- Get tier limits
  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 40
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

-- ============================================================================
-- Add comment to track this fix
-- ============================================================================

COMMENT ON FUNCTION get_user_tier_limits(UUID) IS
'Fixed 2025-10-29: Corrected column reference from id to user_id in user_profiles table query';

COMMENT ON FUNCTION check_blueprint_creation_limit(UUID) IS
'Fixed 2025-10-29: Corrected column reference from id to user_id in user_profiles table query';

COMMENT ON FUNCTION check_blueprint_saving_limit(UUID) IS
'Fixed 2025-10-29: Corrected column reference from id to user_id in user_profiles table query';