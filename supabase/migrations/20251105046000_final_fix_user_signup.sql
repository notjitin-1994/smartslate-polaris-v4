-- Migration: 20251105046000_final_fix_user_signup.sql
-- Description: Final fix for user signup - include ALL columns including version
-- Author: System
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- Final comprehensive fix for log_user_signup()
-- ============================================================================

CREATE OR REPLACE FUNCTION log_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    -- Create user profile with ALL required columns
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
      blueprint_usage_metadata,
      version  -- Optimistic locking version
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name',
        TRIM(CONCAT(
          COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
          ' ',
          COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        ))
      ),
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
      2,  -- blueprint_creation_limit
      2,  -- blueprint_saving_limit
      jsonb_build_object(
        'creation_reset_date', NULL,
        'saving_reset_date', NULL,
        'exempt_from_limits', false,
        'exemption_reason', NULL,
        'last_blueprint_created', NULL,
        'last_blueprint_saved', NULL
      ),
      1   -- version (start at 1 for optimistic locking)
    );
  END IF;

  -- Log activity (non-blocking)
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
      -- Don't fail signup if activity logging fails
      RAISE WARNING 'Failed to log user signup: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Detailed error for debugging
    RAISE EXCEPTION 'User profile creation failed for user %: %. HINT: Check column constraints and defaults.', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_user_signup IS 'Creates user profile with ALL required columns (including version) AND logs signup activity';

COMMIT;
