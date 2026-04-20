-- Migration: 20251025010000_update_tier_system.sql
-- Description: Update tier system to match new requirements
-- Author: System
-- Date: 2025-10-25
-- Requirements:
-- - Tiers: Free, Explorer, Navigator, Voyager, Crew Member, Fleet Member, Armada Member, Developer
-- - Remove Enterprise tier
-- - All users are Free tier by default
-- - Developer is a role, not a tier (with unlimited access)
-- - Subscription determines tier for paid users

BEGIN;

-- ============================================================================
-- 1. Create temporary mapping tables for data migration
-- ============================================================================

-- Store current user data for rollback
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'temp_user_profiles_backup') THEN
    CREATE TEMP TABLE temp_user_profiles_backup AS
    SELECT user_id, user_role, subscription_tier, subscription_metadata
    FROM public.user_profiles;
  END IF;
END $$;

-- ============================================================================
-- 2. Update subscription_tier constraint to new tiers
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_subscription_tier;

-- Add new constraint with updated tiers
-- New tiers: free, explorer, navigator, voyager, crew, fleet, armada
-- Note: developer is a role, not a tier
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_subscription_tier
CHECK (subscription_tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'));

-- ============================================================================
-- 3. Update user_role constraint to new roles
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_user_role;

-- Add new constraint with updated roles
-- Roles: user, developer, admin
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_user_role
CHECK (user_role IN ('user', 'developer', 'admin'));

-- ============================================================================
-- 4. Migrate existing data to new tier system
-- ============================================================================

-- Update all existing subscription_tier values:
-- - explorer (old free tier) → free (new free tier)
-- - developer (as tier) → free (developer is now a role)
-- - enterprise → armada (highest paid tier)
-- - All others stay the same
UPDATE public.user_profiles
SET subscription_tier = CASE
  WHEN subscription_tier = 'explorer' THEN 'free'
  WHEN subscription_tier = 'developer' THEN 'free'
  WHEN subscription_tier = 'enterprise' THEN 'armada'
  ELSE subscription_tier
END;

-- Update all existing user_role values:
-- - All old tier-based roles → 'user', except 'developer' and 'admin'
-- First, let's see what values exist and update them appropriately
UPDATE public.user_profiles
SET user_role = CASE
  WHEN user_role IN ('developer', 'admin') THEN user_role  -- Keep existing admin/developer roles
  WHEN user_role IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise') THEN 'user'  -- Convert old tier roles to user
  ELSE 'user'  -- Default any other values to user
END;

-- ============================================================================
-- 5. Update handle_new_user() function for new default values
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
    'free',  -- All users start as Free tier
    'user',  -- All users start as User role
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
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record when a new auth user is created (updated for new tier system)';

-- ============================================================================
-- 6. Update get_user_limits function to handle developer role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_limits(p_user_id UUID)
RETURNS TABLE(
  role TEXT,
  max_generations_monthly INTEGER,
  max_saved_starmaps INTEGER,
  current_generations INTEGER,
  current_saved_starmaps INTEGER,
  generations_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_role,
    CASE 
      WHEN up.user_role = 'developer' THEN -1  -- Unlimited for developers
      ELSE COALESCE((up.subscription_metadata #>> '{limits,max_generations_monthly}')::INTEGER, 2)
    END AS max_generations_monthly,
    CASE 
      WHEN up.user_role = 'developer' THEN -1  -- Unlimited for developers
      ELSE COALESCE((up.subscription_metadata #>> '{limits,max_saved_starmaps}')::INTEGER, 2)
    END AS max_saved_starmaps,
    COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0) AS current_generations,
    COALESCE((up.subscription_metadata #>> '{usage,saved_starmaps}')::INTEGER, 0) AS current_saved_starmaps,
    CASE 
      WHEN up.user_role = 'developer' THEN -1  -- Unlimited for developers
      ELSE GREATEST(
        0,
        COALESCE((up.subscription_metadata #>> '{limits,max_generations_monthly}')::INTEGER, 2) -
        COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0)
      )
    END AS generations_remaining
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_limits IS 'Get current usage and remaining quota for a user (updated for new tier system)';

-- ============================================================================
-- 7. Update table comments to reflect new system
-- ============================================================================

COMMENT ON COLUMN public.user_profiles.subscription_tier IS
'The subscription plan tier: free, explorer, navigator, voyager, crew, fleet, armada';

COMMENT ON COLUMN public.user_profiles.user_role IS
'User permission level: user (default), developer (admin access), admin (full system access)';

-- ============================================================================
-- 8. Create function to check if user has unlimited access (developer)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_unlimited_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = p_user_id
    AND user_role = 'developer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_unlimited_access IS
'Check if a user has unlimited access (developer role)';

-- ============================================================================
-- 9. Update role_audit_log to handle new role values
-- ============================================================================

-- Add migration metadata to existing audit log entries
UPDATE public.role_audit_log
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{migration_20251025010000}',
  jsonb_build_object(
    'migrated_at', NOW(),
    'note', 'Updated to new tier system: Free/Explorer/Navigator/Voyager/Crew/Fleet/Armada tiers, User/Developer/Admin roles'
  )
)
WHERE created_at < NOW();

-- ============================================================================
-- 10. Add migration record to track this change
-- ============================================================================

-- Create a migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  affected_rows INTEGER
);

-- Log this migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'temp_user_profiles_backup') THEN
    INSERT INTO public.migration_log (migration_name, description, affected_rows)
    VALUES (
      '20251025010000_update_tier_system',
      'Updated tier system: Free/Explorer/Navigator/Voyager/Crew/Fleet/Armada tiers, User/Developer/Admin roles, removed Enterprise tier',
      (SELECT COUNT(*) FROM temp_user_profiles_backup)
    );
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Post-Migration Verification Queries
-- ============================================================================

-- Verify role distribution
-- SELECT user_role, COUNT(*) as count
-- FROM public.user_profiles
-- GROUP BY user_role;

-- Verify tier distribution
-- SELECT subscription_tier, COUNT(*) as count
-- FROM public.user_profiles
-- GROUP BY subscription_tier;

-- Verify constraints
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.user_profiles'::regclass
-- AND (conname LIKE '%role%' OR conname LIKE '%tier%');

-- Test the new functions
-- SELECT * FROM public.get_user_limits('your-user-id'::UUID);
-- SELECT public.has_unlimited_access('your-user-id'::UUID);