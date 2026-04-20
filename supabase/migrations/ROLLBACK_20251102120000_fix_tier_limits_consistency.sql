-- Rollback Migration: Fix Tier Limits Consistency
-- Description: Revert tier limit standardization changes
-- Date: 2025-11-02

-- Note: This rollback cannot restore the exact previous state of user_profiles
-- because users had inconsistent limits. This rollback sets voyager back to 40
-- in functions (the most common previous value) but does not change user data.

-- ============================================================================
-- STEP 1: Revert database functions to previous voyager limit (40)
-- ============================================================================

-- Function: check_blueprint_creation_limit (revert voyager to 40)
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
  SELECT subscription_tier, user_role INTO v_subscription_tier, v_user_role
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF v_user_role IN ('developer', 'admin') THEN
    RETURN QUERY SELECT TRUE, 0, -1, 'Unlimited access for developers and admins'::TEXT;
    RETURN;
  END IF;

  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 40  -- REVERTED from 50
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  SELECT COUNT(*)
  INTO v_current_count
  FROM blueprint_generator
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    AND (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP);

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

-- Function: check_blueprint_saving_limit (revert voyager to 40)
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
  SELECT subscription_tier, user_role INTO v_subscription_tier, v_user_role
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF v_user_role IN ('developer', 'admin') THEN
    RETURN QUERY SELECT TRUE, 0, -1, 'Unlimited access for developers and admins'::TEXT;
    RETURN;
  END IF;

  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 40  -- REVERTED from 50
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  SELECT COUNT(*)
  INTO v_current_count
  FROM blueprint_generator
  WHERE user_id = p_user_id
    AND status IN ('completed', 'generating')
    AND (deleted_at IS NULL OR deleted_at > CURRENT_TIMESTAMP);

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

-- Function: get_user_tier_limits (revert voyager to 40)
CREATE OR REPLACE FUNCTION get_user_tier_limits(p_user_id UUID)
RETURNS TABLE (
  blueprint_creation_limit INTEGER,
  blueprint_saving_limit INTEGER,
  subscription_tier TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_subscription_tier TEXT;
BEGIN
  SELECT user_profiles.subscription_tier INTO v_subscription_tier
  FROM user_profiles
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    CASE v_subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 40  -- REVERTED from 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END AS blueprint_creation_limit,
    CASE v_subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 40  -- REVERTED from 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END AS blueprint_saving_limit,
    v_subscription_tier;
END;
$$;

-- Trigger Function: update_user_tier_limits (revert voyager to 40)
CREATE OR REPLACE FUNCTION update_user_tier_limits()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    NEW.blueprint_creation_limit := CASE NEW.subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 40  -- REVERTED from 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END;

    NEW.blueprint_saving_limit := CASE NEW.subscription_tier
      WHEN 'free' THEN 2
      WHEN 'explorer' THEN 5
      WHEN 'navigator' THEN 25
      WHEN 'voyager' THEN 40  -- REVERTED from 50
      WHEN 'crew' THEN 10
      WHEN 'fleet' THEN 30
      WHEN 'armada' THEN 60
      ELSE 2
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger Function: sync_subscription_to_user_profile (revert to mixed state - use 50)
CREATE OR REPLACE FUNCTION sync_subscription_to_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_blueprint_limit INTEGER;
BEGIN
  v_blueprint_limit := CASE NEW.subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 50  -- This was inconsistent before (keeping 50)
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

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
