-- Migration: 20251105043000_fix_user_signup_trigger.sql
-- Description: Fix user signup by ensuring both profile creation AND activity logging happen
-- Author: System
-- Date: 2025-11-05
-- Issue: Migration 0035 replaced handle_new_user trigger, breaking user profile creation

BEGIN;

-- ============================================================================
-- Fix: Update log_user_signup() to ALSO create user profile
-- ============================================================================

-- This function needs to do BOTH:
-- 1. Create the user profile (what handle_new_user() did)
-- 2. Log the signup activity (what the original log_user_signup() did)

CREATE OR REPLACE FUNCTION log_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- STEP 1: Create user profile (critical - was missing!)
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',
    'user',
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
        'max_generations_monthly', 2,
        'max_saved_starmaps', 2
      )
    ),
    NOW(),
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

  -- STEP 2: Log the user creation activity
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
      'email', NEW.email,
      'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
      'email_confirmed', NEW.email_confirmed_at IS NOT NULL
    ),
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_user_signup IS 'Creates user profile AND logs signup activity when new user is created';

COMMIT;

-- ============================================================================
-- Verification: Check that trigger is properly attached
-- ============================================================================

-- Run this query to verify the trigger exists:
-- SELECT
--   tgname as trigger_name,
--   proname as function_name,
--   tgenabled as enabled
-- FROM pg_trigger t
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgname = 'on_auth_user_created';
