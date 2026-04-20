-- Migration: 0033_update_roles_and_tiers.sql
-- Description: Update roles to User/Developer/Admin and tiers to remove Enterprise
-- Author: System
-- Date: 2025-10-25
-- Breaking Change: Yes - updates role and tier enums

BEGIN;

-- ============================================================================
-- 1. Create temporary mapping tables for data migration
-- ============================================================================

-- Store current user data for rollback
CREATE TEMP TABLE temp_user_profiles_backup AS
SELECT user_id, user_role, subscription_tier
FROM public.user_profiles;

-- ============================================================================
-- 2. Update user_role constraint to new roles (User, Developer, Admin)
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_user_role;

-- First, update existing data to handle all possible old values
UPDATE public.user_profiles
SET user_role = CASE
  WHEN user_role IN ('developer', 'admin') THEN user_role  -- Keep existing admin/developer roles
  WHEN user_role IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise') THEN 'user'  -- Convert old tier roles to user
  ELSE 'user'  -- Default any other values to user
END;

-- Add new constraint with updated roles
-- Mapping: All old tier-based roles → 'user', 'developer' stays 'developer'
-- Admin role is new and must be manually assigned
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_user_role
CHECK (user_role IN ('user', 'developer', 'admin'));

-- ============================================================================
-- 3. Update subscription_tier constraint to new tiers (remove enterprise)
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_subscription_tier;

-- First, update existing data to handle all possible old values
UPDATE public.user_profiles
SET subscription_tier = CASE
  WHEN subscription_tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada') THEN subscription_tier  -- Keep valid tiers
  WHEN subscription_tier = 'enterprise' THEN 'armada'  -- Map enterprise to armada
  WHEN subscription_tier = 'developer' THEN 'free'  -- Developer is now a role, not a tier
  ELSE 'free'  -- Default any other values to free
END;

-- Add new constraint with updated tiers
-- New tiers: free, explorer, navigator, voyager, crew, fleet, armada
-- Removed: enterprise, developer (developer is a role, not a tier)
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_subscription_tier
CHECK (subscription_tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'));

-- ============================================================================
-- 4. Migrate existing data to new role system
-- ============================================================================

-- Update all existing user_role values to 'user' except developer
UPDATE public.user_profiles
SET user_role = CASE
  WHEN user_role = 'developer' THEN 'developer'
  ELSE 'user'
END;

-- ============================================================================
-- 5. Migrate existing data to new tier system
-- ============================================================================

-- Map old tiers to new tiers:
-- explorer → free (was the free tier)
-- developer (as tier) → free (developer is now a role)
-- enterprise → armada (highest paid tier)
-- All others stay the same
UPDATE public.user_profiles
SET subscription_tier = CASE
  WHEN subscription_tier = 'explorer' THEN 'free'
  WHEN subscription_tier = 'developer' THEN 'free'
  WHEN subscription_tier = 'enterprise' THEN 'armada'
  ELSE subscription_tier
END;

-- ============================================================================
-- 6. Update role_audit_log to handle new role values
-- ============================================================================

-- The role_audit_log table doesn't have constraints, but we should
-- add a note in the metadata about the migration

-- Add migration metadata to existing audit log entries
UPDATE public.role_audit_log
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{migration_0033}',
  jsonb_build_object(
    'migrated_at', NOW(),
    'note', 'Roles updated from tier-based to User/Developer/Admin system'
  )
)
WHERE created_at < NOW();

-- ============================================================================
-- 7. Update handle_new_user() function for new default values
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
    'free',  -- Changed from 'explorer' to 'free'
    'user',  -- Changed from 'explorer' to 'user'
    jsonb_build_object(
      'plan_id', 'free',  -- Changed from 'explorer'
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

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record when a new auth user is created (updated for new role/tier system)';

-- ============================================================================
-- 8. Update table comments to reflect new system
-- ============================================================================

COMMENT ON COLUMN public.user_profiles.subscription_tier IS
'The subscription plan tier: free, explorer, navigator, voyager, crew, fleet, armada';

COMMENT ON COLUMN public.user_profiles.user_role IS
'User permission level: user (default), developer (admin access), admin (full system access)';

-- ============================================================================
-- 9. Create helper function to check if user is admin or developer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_developer(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = p_user_id
    AND user_role IN ('admin', 'developer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin_or_developer IS
'Check if a user has admin or developer role';

-- ============================================================================
-- 10. Create function to get user role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT user_role INTO v_role
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role IS
'Get the role for a user (returns user if not found)';

-- ============================================================================
-- 11. Update indexes (already exist from previous migration, just verify)
-- ============================================================================

-- Indexes already exist from migration 0026, no changes needed
-- idx_user_profiles_user_role
-- idx_user_profiles_subscription_tier

-- ============================================================================
-- 12. Add migration record to track this change
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
INSERT INTO public.migration_log (migration_name, description, affected_rows)
VALUES (
  '0033_update_roles_and_tiers',
  'Updated roles to User/Developer/Admin and removed Enterprise tier',
  (SELECT COUNT(*) FROM temp_user_profiles_backup)
);

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
-- AND conname LIKE '%role%' OR conname LIKE '%tier%';
