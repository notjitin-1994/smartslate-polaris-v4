-- Migration: 20251105045000_fix_user_signup_with_error_handling.sql
-- Description: Fix user signup trigger with proper error handling and NULL safety
-- Author: System
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- Update log_user_signup() with comprehensive error handling
-- ============================================================================

CREATE OR REPLACE FUNCTION log_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists (prevent duplicate key errors)
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
  ) INTO v_profile_exists;

  -- Only create profile if it doesn't exist
  IF NOT v_profile_exists THEN
    -- STEP 1: Create user profile with NULL-safe values
    INSERT INTO public.user_profiles (
      user_id,
      email,
      first_name,
      last_name,
      full_name,
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
      NEW.id,
      COALESCE(NEW.email, ''),  -- Ensure NOT NULL
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'free',
      'user',
      jsonb_build_object(
        'plan_id', 'free',
        'billing_cycle', 'monthly',
        'started_at', COALESCE(NEW.created_at, NOW()),
        'renewal_date', COALESCE(NEW.created_at, NOW()) + INTERVAL '1 month',
        'usage', jsonb_build_object(
          'generations_this_month', 0,
          'saved_starmaps', 0,
          'last_reset', NOW()
        ),
        'limits', jsonb_build_object(
          'max_generations_monthly', 2,
          'max_saved_starmaps', 2
        )
      ),
      COALESCE(NEW.created_at, NOW()),
      0,  -- blueprint_creation_count
      0,  -- blueprint_saving_count
      2,  -- blueprint_creation_limit (free tier)
      2,  -- blueprint_saving_limit (free tier)
      jsonb_build_object(
        'creation_reset_date', NULL,
        'saving_reset_date', NULL,
        'exempt_from_limits', false,
        'exemption_reason', NULL,
        'last_blueprint_created', NULL,
        'last_blueprint_saved', NULL
      )
    );
  END IF;

  -- STEP 2: Log the user creation activity (separate try-catch equivalent)
  BEGIN
    INSERT INTO activity_logs (
      user_id,
      actor_id,
      action_type,
      resource_type,
      resource_id,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.id,
      'user_created',
      'user',
      NEW.id,
      jsonb_build_object(
        'email', COALESCE(NEW.email, ''),
        'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        'email_confirmed', NEW.email_confirmed_at IS NOT NULL
      ),
      COALESCE(NEW.created_at, NOW())
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the entire signup
      RAISE WARNING 'Failed to log user signup activity: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error and re-raise
    RAISE EXCEPTION 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_user_signup IS 'Creates user profile AND logs signup activity when new user is created (with error handling)';

COMMIT;
