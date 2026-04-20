-- Rollback Migration: ROLLBACK_0026_add_subscription_and_roles.sql
-- Description: Rollback subscription tier, user role, and usage tracking changes
-- Author: System
-- Date: 2025-10-09
-- WARNING: This will remove all subscription and role data!

BEGIN;

-- ============================================================================
-- 1. Drop triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_log_role_change ON public.user_profiles;
DROP FUNCTION IF EXISTS public.log_role_change();

-- ============================================================================
-- 2. Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_limits(UUID);
DROP FUNCTION IF EXISTS public.reset_monthly_usage();
DROP FUNCTION IF EXISTS public.increment_usage(UUID, TEXT, INTEGER);

-- ============================================================================
-- 3. Drop RLS policies
-- ============================================================================

-- user_profiles policies
DROP POLICY IF EXISTS "Developers have full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- role_audit_log policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.role_audit_log;
DROP POLICY IF EXISTS "Developers can view audit logs" ON public.role_audit_log;

-- user_usage_history policies
DROP POLICY IF EXISTS "System can insert usage history" ON public.user_usage_history;
DROP POLICY IF EXISTS "Developers can view all usage history" ON public.user_usage_history;
DROP POLICY IF EXISTS "Users can view their own usage history" ON public.user_usage_history;

-- ============================================================================
-- 4. Drop tables
-- ============================================================================

DROP TABLE IF EXISTS public.role_audit_log CASCADE;
DROP TABLE IF EXISTS public.user_usage_history CASCADE;

-- ============================================================================
-- 5. Drop indexes from user_profiles
-- ============================================================================

DROP INDEX IF EXISTS public.idx_user_profiles_metadata;
DROP INDEX IF EXISTS public.idx_user_profiles_subscription_tier;
DROP INDEX IF EXISTS public.idx_user_profiles_user_role;

-- ============================================================================
-- 6. Drop constraints from user_profiles
-- ============================================================================

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_user_role;

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_subscription_tier;

-- ============================================================================
-- 7. Drop columns from user_profiles
-- ============================================================================

ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS role_assigned_by,
DROP COLUMN IF EXISTS role_assigned_at,
DROP COLUMN IF EXISTS subscription_metadata,
DROP COLUMN IF EXISTS user_role,
DROP COLUMN IF EXISTS subscription_tier;

-- ============================================================================
-- 8. Recreate original RLS policies for user_profiles
-- ============================================================================

-- Note: Recreate original policies as they existed before migration
-- Adjust these based on your actual pre-migration policies

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;

-- ============================================================================
-- Verification Queries (run after rollback)
-- ============================================================================

-- Verify columns removed
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name IN ('subscription_tier', 'user_role', 'subscription_metadata');
-- Expected: No rows

-- Verify tables dropped
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('user_usage_history', 'role_audit_log') AND table_schema = 'public';
-- Expected: No rows

-- Verify functions dropped
-- SELECT proname FROM pg_proc WHERE proname IN ('increment_usage', 'reset_monthly_usage', 'get_user_limits');
-- Expected: No rows

