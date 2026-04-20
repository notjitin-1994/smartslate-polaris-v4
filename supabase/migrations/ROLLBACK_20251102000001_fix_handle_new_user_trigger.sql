-- Rollback Migration: ROLLBACK_20251102000001_fix_handle_new_user_trigger.sql
-- Description: Revert to the version with ON CONFLICT if needed
-- Author: System
-- Date: 2025-11-02

BEGIN;

-- ============================================================================
-- Restore the handle_new_user trigger with ON CONFLICT clause
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
    role_assigned_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'explorer',
    'explorer',
    jsonb_build_object(
      'plan_id', 'explorer',
      'billing_cycle', 'monthly',
      'started_at', NEW.created_at,
      'renewal_date', NEW.created_at + INTERVAL '1 month',
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
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.user_profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record with email, first_name, and last_name when a new auth user is created';

COMMIT;
