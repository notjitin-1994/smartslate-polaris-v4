-- Rollback Migration: ROLLBACK_0033_update_roles_and_tiers.sql
-- Description: Rollback roles and tiers to original tier-based system
-- Author: System
-- Date: 2025-10-25

BEGIN;

-- ============================================================================
-- 1. Restore original constraints
-- ============================================================================

-- Drop new constraints
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_user_role;

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_subscription_tier;

-- Restore original role constraint (tier-based roles)
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_user_role
CHECK (user_role IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'));

-- Restore original tier constraint (includes enterprise)
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_subscription_tier
CHECK (subscription_tier IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'));

-- ============================================================================
-- 2. Revert data to old system
-- ============================================================================

-- This is a best-effort rollback since we can't perfectly restore the original
-- tier-based role system. All 'user' roles will become 'explorer'.

-- Revert user_role: user → explorer, keep developer/admin → developer
UPDATE public.user_profiles
SET user_role = CASE
  WHEN user_role IN ('admin', 'developer') THEN 'developer'
  WHEN user_role = 'user' THEN 'explorer'
  ELSE 'explorer'
END;

-- Revert subscription_tier: free → explorer, armada might have been enterprise
UPDATE public.user_profiles
SET subscription_tier = CASE
  WHEN subscription_tier = 'free' THEN 'explorer'
  -- Note: We can't distinguish between original 'armada' and migrated 'enterprise' users
  -- They will all remain as 'armada'
  ELSE subscription_tier
END;

-- ============================================================================
-- 3. Restore original handle_new_user() function
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
    'explorer',  -- Restored from 'free'
    'explorer',  -- Restored from 'user'
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

-- ============================================================================
-- 4. Restore original table comments
-- ============================================================================

COMMENT ON COLUMN public.user_profiles.subscription_tier IS
'The subscription plan tier the user is on (explorer, navigator, voyager, crew, fleet, armada, enterprise, developer)';

COMMENT ON COLUMN public.user_profiles.user_role IS
'The role assigned to the user, typically matches subscription_tier but can be overridden by admins';

-- ============================================================================
-- 5. Drop new helper functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin_or_developer(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- ============================================================================
-- 6. Log rollback
-- ============================================================================

INSERT INTO public.migration_log (migration_name, description)
VALUES (
  'ROLLBACK_0033_update_roles_and_tiers',
  'Rolled back to tier-based roles system'
);

COMMIT;

-- ============================================================================
-- WARNINGS
-- ============================================================================

-- WARNING: This rollback cannot perfectly restore the original state:
-- 1. Users who were assigned 'admin' role will become 'developer'
-- 2. Cannot distinguish between original 'armada' and migrated 'enterprise' users
-- 3. All metadata about admin assignments will be preserved in audit logs
-- 4. Free tier users (was 'explorer', became 'free') will go back to 'explorer'
