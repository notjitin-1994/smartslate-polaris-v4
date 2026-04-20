-- Migration: 20251025030000_fix_tier_limits_migration.sql
-- Description: Fix tier limits migration by dropping and recreating functions
-- Author: System
-- Date: 2025-10-25

BEGIN;

-- ============================================================================
-- 1. Drop existing functions to recreate them with correct signatures
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_user_limits(UUID);
DROP FUNCTION IF EXISTS public.check_blueprint_creation_limits(UUID);
DROP FUNCTION IF EXISTS public.check_blueprint_saving_limits(UUID);

-- ============================================================================
-- 2. Update tier limits in subscription_metadata for existing users
-- ============================================================================

-- Update Explorer tier users
UPDATE public.user_profiles
SET 
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '5'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '5'::jsonb
  ),
  blueprint_creation_limit = 5,
  blueprint_saving_limit = 5
WHERE subscription_tier = 'explorer';

-- Update Navigator tier users
UPDATE public.user_profiles
SET 
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '20'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '20'::jsonb
  ),
  blueprint_creation_limit = 20,
  blueprint_saving_limit = 20
WHERE subscription_tier = 'navigator';

-- Update Voyager tier users
UPDATE public.user_profiles
SET 
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '40'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '40'::jsonb
  ),
  blueprint_creation_limit = 40,
  blueprint_saving_limit = 40
WHERE subscription_tier = 'voyager';

-- Update Crew tier users
UPDATE public.user_profiles
SET
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '10'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '10'::jsonb
  ),
  blueprint_creation_limit = 10,
  blueprint_saving_limit = 10
WHERE subscription_tier = 'crew';

-- Update Fleet tier users
UPDATE public.user_profiles
SET
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '30'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '30'::jsonb
  ),
  blueprint_creation_limit = 30,
  blueprint_saving_limit = 30
WHERE subscription_tier = 'fleet';

-- Update Armada tier users
UPDATE public.user_profiles
SET
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '60'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '60'::jsonb
  ),
  blueprint_creation_limit = 60,
  blueprint_saving_limit = 60
WHERE subscription_tier = 'armada';

-- Update Free tier users (default for all users)
UPDATE public.user_profiles
SET 
  subscription_metadata = jsonb_set(
    jsonb_set(
      subscription_metadata,
      '{limits,max_generations_monthly}',
      '2'::jsonb
    ),
    '{limits,max_saved_starmaps}',
    '2'::jsonb
  ),
  blueprint_creation_limit = 2,
  blueprint_saving_limit = 2
WHERE subscription_tier = 'free';

-- ============================================================================
-- 3. Recreate the get_user_limits function with correct signature
-- ============================================================================

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
  -- Get user info and check if exempt (developer role)
  SELECT 
    up.user_role,
    up.subscription_tier,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean,
    COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0),
    COALESCE((up.subscription_metadata #>> '{usage,saved_starmaps}')::INTEGER, 0)
  INTO v_user_role, v_subscription_tier, v_is_exempt, v_current_generations, v_current_saved
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
  
  -- If user is not found, return default values
  IF v_user_role IS NULL THEN
    RETURN QUERY SELECT 
      'user'::TEXT, 
      'free'::TEXT, 
      2, 2, 0, 0, 2, 2, false;
    RETURN;
  END IF;
  
  -- Check if user is exempt from limits (developer role)
  IF v_user_role = 'developer' OR v_is_exempt = true THEN
    RETURN QUERY SELECT 
      v_user_role,
      v_subscription_tier,
      -1, -- unlimited generations
      -1, -- unlimited saved
      v_current_generations,
      v_current_saved,
      -1, -- unlimited remaining
      -1, -- unlimited remaining
      true;
  ELSE
    -- Return limits based on subscription tier
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
        ELSE 2 -- default to free tier limits
      END AS max_generations_monthly,
      CASE v_subscription_tier
        WHEN 'free' THEN 2
        WHEN 'explorer' THEN 5
        WHEN 'navigator' THEN 20
        WHEN 'voyager' THEN 40
        WHEN 'crew' THEN 10
        WHEN 'fleet' THEN 30
        WHEN 'armada' THEN 60
        ELSE 2 -- default to free tier limits
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

-- ============================================================================
-- 4. Recreate the check_blueprint_creation_limits function
-- ============================================================================

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
  -- Get user info and current usage
  SELECT 
    up.user_role,
    up.subscription_tier,
    up.blueprint_creation_count,
    up.blueprint_creation_limit,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO v_user_role, v_subscription_tier, v_current_count, v_limit_count, v_is_exempt
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
  
  -- Handle case where user is not found
  IF v_user_role IS NULL THEN
    RETURN QUERY SELECT false, 0, 2, 0, 'User not found';
    RETURN;
  END IF;
  
  -- Check if user is exempt from limits (developer role)
  IF v_user_role = 'developer' OR v_is_exempt = true THEN
    RETURN QUERY SELECT true, v_current_count, -1, -1, 'Unlimited access (Developer)';
    RETURN;
  END IF;
  
  -- Determine limit based on subscription tier
  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 20
    WHEN 'voyager' THEN 40
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2 -- default to free tier limits
  END;
  
  -- Check if user can create more blueprints
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

-- ============================================================================
-- 5. Recreate the check_blueprint_saving_limits function
-- ============================================================================

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
  -- Get user info and current usage
  SELECT 
    up.user_role,
    up.subscription_tier,
    up.blueprint_saving_count,
    up.blueprint_saving_limit,
    (up.blueprint_usage_metadata->>'exempt_from_limits')::boolean
  INTO v_user_role, v_subscription_tier, v_current_count, v_limit_count, v_is_exempt
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
  
  -- Handle case where user is not found
  IF v_user_role IS NULL THEN
    RETURN QUERY SELECT false, 0, 2, 0, 'User not found';
    RETURN;
  END IF;
  
  -- Check if user is exempt from limits (developer role)
  IF v_user_role = 'developer' OR v_is_exempt = true THEN
    RETURN QUERY SELECT true, v_current_count, -1, -1, 'Unlimited access (Developer)';
    RETURN;
  END IF;
  
  -- Determine limit based on subscription tier
  v_limit_count := CASE v_subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 20
    WHEN 'voyager' THEN 40
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2 -- default to free tier limits
  END;
  
  -- Check if user can save more blueprints
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

COMMIT;

-- ============================================================================
-- Verification Queries (run after migration)
-- ============================================================================

-- Verify limits were updated correctly
-- SELECT subscription_tier, blueprint_creation_limit, blueprint_saving_limit 
-- FROM public.user_profiles 
-- GROUP BY subscription_tier, blueprint_creation_limit, blueprint_saving_limit 
-- ORDER BY subscription_tier;

-- Test the updated functions
-- SELECT * FROM public.get_user_limits('your-user-id'::UUID);
-- SELECT * FROM public.check_blueprint_creation_limits('your-user-id'::UUID);
-- SELECT * FROM public.check_blueprint_saving_limits('your-user-id'::UUID);