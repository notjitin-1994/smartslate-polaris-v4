-- Migration: 20251105040000_fix_handle_new_user_trigger.sql
-- Description: Fix handle_new_user() trigger to include all required columns
-- Author: System
-- Date: 2025-11-05
-- Issue: Database error saving new user - missing blueprint tracking columns in trigger

BEGIN;

-- ============================================================================
-- Update handle_new_user() function to include ALL required columns
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    -- Blueprint tracking columns (added in migration 0027)
    blueprint_creation_count,
    blueprint_saving_count,
    blueprint_creation_limit,
    blueprint_saving_limit,
    blueprint_usage_metadata
  ) VALUES (
    NEW.id,
    NEW.email,  -- Email from auth.users
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),  -- First name from signup data
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),   -- Last name from signup data
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),   -- Full name from signup data
    'free',  -- Default tier
    'user',  -- Default role
    jsonb_build_object(
      'plan_id', 'free',
      'billing_cycle', 'monthly',
      'started_at', NEW.created_at,
      'renewal_date', NEW.created_at + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', 2,  -- Free tier: 2 blueprints/month
        'max_saved_starmaps', 2
      )
    ),
    NOW(),
    -- Blueprint tracking default values
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record when a new auth user is created (includes all required columns)';

COMMIT;

-- ============================================================================
-- Verification Queries (run manually if needed)
-- ============================================================================

-- Test trigger by creating a test user (run this in Supabase SQL Editor if needed):
-- SELECT * FROM auth.users WHERE email = 'test-trigger@example.com';
--
-- If test user exists, check their profile:
-- SELECT * FROM public.user_profiles WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email = 'test-trigger@example.com'
-- );
