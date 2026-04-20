-- Migration: 0042_fix_create_user_profile_role_constraint.sql
-- Description: Fix user_role constraint violation in create_user_profile function
-- The function was setting user_role='explorer' but the check constraint only allows ('user', 'developer', 'admin')
-- This migration updates the function to use 'user' as the default role
-- Author: System
-- Date: 2025-11-18

BEGIN;

-- ============================================================================
-- Update create_user_profile function to use 'user' instead of 'explorer'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.user_profiles AS $$
DECLARE
  v_profile public.user_profiles;
BEGIN
  -- Ensure user can only create their own profile
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create profile for another user';
  END IF;

  -- Check if profile already exists
  SELECT * INTO v_profile
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  IF FOUND THEN
    RETURN v_profile;
  END IF;

  -- Create the profile with default subscription settings
  -- FIXED: Changed user_role from 'explorer' to 'user' to match constraint
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    first_name,
    last_name,
    avatar_url,
    subscription_tier,
    user_role,
    subscription_metadata,
    role_assigned_at,
    blueprint_creation_count,
    blueprint_saving_count,
    blueprint_creation_limit,
    blueprint_saving_limit,
    blueprint_usage_metadata
  ) VALUES (
    p_user_id,
    COALESCE(p_full_name, ''),
    COALESCE(p_first_name, ''),
    COALESCE(p_last_name, ''),
    p_avatar_url,
    'explorer',  -- subscription_tier (this is fine, different from user_role)
    'user',      -- user_role (FIXED: changed from 'explorer' to 'user')
    jsonb_build_object(
      'plan_id', 'explorer',
      'billing_cycle', 'monthly',
      'started_at', NOW(),
      'renewal_date', NOW() + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', 5,
        'max_saved_starmaps', 5
      )
    ),
    NOW(),
    0,
    0,
    2,
    2,
    jsonb_build_object(
      'creation_reset_date', NULL,
      'saving_reset_date', NULL,
      'exempt_from_limits', false,
      'exemption_reason', NULL,
      'last_blueprint_created', NULL,
      'last_blueprint_saved', NULL
    )
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_user_profile IS 'Safely create a user profile with proper defaults, bypassing RLS for FK validation. Uses user_role=user to match check constraint.';

-- ============================================================================
-- Update existing profiles that have user_role='explorer' to 'user'
-- ============================================================================

-- Update any existing profiles that might have the old 'explorer' role
UPDATE public.user_profiles
SET user_role = 'user'
WHERE user_role = 'explorer';

COMMIT;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration:
-- 1. Restore the original function with user_role='explorer'
-- 2. Update profiles back to user_role='explorer'
-- However, this would violate the constraint, so you'd need to:
-- - Either remove the check_valid_user_role constraint first
-- - Or keep user_role='user' and adjust application logic
