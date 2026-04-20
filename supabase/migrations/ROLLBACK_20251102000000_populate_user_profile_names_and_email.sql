-- Rollback Migration: ROLLBACK_20251102000000_populate_user_profile_names_and_email.sql
-- Description: Revert handle_new_user trigger to previous version (without name/email population)
-- Author: System
-- Date: 2025-11-02

BEGIN;

-- ============================================================================
-- 1. Restore the original handle_new_user trigger (without name/email fields)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    subscription_tier,
    user_role,
    subscription_metadata,
    role_assigned_at
  ) VALUES (
    NEW.id,
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record when a new auth user is created';

-- Note: This rollback does NOT delete the backfilled data (email, first_name, last_name)
-- from existing user_profiles records. If you need to clear that data, run additional
-- UPDATE statements manually.

COMMIT;
