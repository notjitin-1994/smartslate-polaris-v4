-- Migration: 0031_fix_user_profile_creation_permissions.sql
-- Description: Fix permission issues when users create their own profiles
-- This addresses the "permission denied for table users" error that occurs
-- when the foreign key constraint tries to validate against auth.users
-- Author: System
-- Date: 2025-10-20

BEGIN;

-- ============================================================================
-- 1. Create a SECURITY DEFINER function for safe profile creation
-- ============================================================================

-- This function allows authenticated users to create their own profile
-- without needing direct access to auth.users table for FK validation
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
    'explorer',
    'explorer',
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

COMMENT ON FUNCTION public.create_user_profile IS 'Safely create a user profile with proper defaults, bypassing RLS for FK validation';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- ============================================================================
-- 2. Create a similar function for getting or creating profile
-- ============================================================================

-- This function is a convenience wrapper that gets existing profile or creates it
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(
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
  -- Ensure user can only access their own profile
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot access another user''s profile';
  END IF;

  -- Try to get existing profile
  SELECT * INTO v_profile
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- If not found, create it
  IF NOT FOUND THEN
    SELECT * INTO v_profile
    FROM public.create_user_profile(
      p_user_id,
      p_full_name,
      p_first_name,
      p_last_name,
      p_avatar_url
    );
  END IF;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_or_create_user_profile IS 'Get existing user profile or create it if it doesn''t exist';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_user_profile TO authenticated;

-- ============================================================================
-- 3. Update RLS policies to ensure they work correctly
-- ============================================================================

-- Recreate the INSERT policy to be more explicit about permissions
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- This policy is now less critical since we use SECURITY DEFINER functions,
-- but we keep it for backward compatibility and direct inserts from service role
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. Fix existing profiles that might be missing data
-- ============================================================================

-- Ensure all existing profiles have the required blueprint tracking fields
UPDATE public.user_profiles
SET
  blueprint_creation_count = COALESCE(blueprint_creation_count, 0),
  blueprint_saving_count = COALESCE(blueprint_saving_count, 0),
  blueprint_creation_limit = COALESCE(blueprint_creation_limit, 2),
  blueprint_saving_limit = COALESCE(blueprint_saving_limit, 2),
  blueprint_usage_metadata = COALESCE(
    blueprint_usage_metadata,
    jsonb_build_object(
      'creation_reset_date', NULL,
      'saving_reset_date', NULL,
      'exempt_from_limits', false,
      'exemption_reason', NULL,
      'last_blueprint_created', NULL,
      'last_blueprint_saved', NULL
    )
  )
WHERE
  blueprint_creation_count IS NULL
  OR blueprint_saving_count IS NULL
  OR blueprint_creation_limit IS NULL
  OR blueprint_saving_limit IS NULL
  OR blueprint_usage_metadata IS NULL;

-- Ensure all profiles have subscription metadata
UPDATE public.user_profiles
SET subscription_metadata = jsonb_build_object(
  'plan_id', COALESCE(subscription_tier, 'explorer'),
  'billing_cycle', 'monthly',
  'started_at', created_at,
  'renewal_date', created_at + INTERVAL '1 month',
  'usage', jsonb_build_object(
    'generations_this_month', 0,
    'saved_starmaps', 0,
    'last_reset', NOW()
  ),
  'limits', jsonb_build_object(
    'max_generations_monthly', 5,
    'max_saved_starmaps', 5
  )
)
WHERE subscription_metadata IS NULL OR subscription_metadata = '{}'::jsonb;

COMMIT;

-- ============================================================================
-- Verification Queries (comment out or run separately)
-- ============================================================================

-- Test the create function (uncomment to test)
-- SELECT * FROM public.create_user_profile(auth.uid(), 'Test User', 'Test', 'User', NULL);

-- Test the get_or_create function (uncomment to test)
-- SELECT * FROM public.get_or_create_user_profile(auth.uid(), 'Test User', 'Test', 'User', NULL);

-- Verify all profiles have required fields
-- SELECT
--   user_id,
--   blueprint_creation_count IS NOT NULL as has_creation_count,
--   blueprint_saving_count IS NOT NULL as has_saving_count,
--   subscription_metadata IS NOT NULL as has_subscription_metadata
-- FROM public.user_profiles;
