-- Fix: Admin Read-Only Policy Infinite Recursion
-- Fixes infinite recursion in user_profiles admin policy
-- Created: 2025-11-09
-- Updated: 2025-11-10
-- Issue: Original policy created circular dependency by querying user_profiles to check user_profiles access
-- Solution: Use SECURITY DEFINER function to bypass RLS and prevent recursion

-- =====================================================
-- 1. CREATE SECURITY DEFINER FUNCTION TO CHECK ADMIN ROLE
-- =====================================================

-- This function bypasses RLS by using SECURITY DEFINER
-- It safely checks if the current user has an admin role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value text;
BEGIN
  -- Get the user's role directly without triggering RLS
  SELECT user_role INTO user_role_value
  FROM user_profiles
  WHERE user_id = auth.uid();

  -- Check if role is in admin list
  RETURN user_role_value IN ('developer', 'enterprise', 'armada', 'fleet', 'crew');
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, fail closed (deny access)
    RETURN FALSE;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.is_admin_user() IS
  'Security definer function that checks if current user has an admin role. Bypasses RLS to prevent infinite recursion in policies.';

-- =====================================================
-- 2. DROP PROBLEMATIC POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all blueprints" ON public.blueprint_generator;
DROP POLICY IF EXISTS "Admins can view all api usage logs" ON public.api_usage_logs;

-- =====================================================
-- 3. RECREATE POLICIES USING THE SAFE FUNCTION
-- =====================================================

-- User profiles admin read policy
CREATE POLICY "Admins can view all user profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Blueprint generator admin read policy
CREATE POLICY "Admins can view all blueprints"
  ON public.blueprint_generator
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- API usage logs admin read policy
CREATE POLICY "Admins can view all api usage logs"
  ON public.api_usage_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- =====================================================
-- 4. ADD POLICY COMMENTS
-- =====================================================

COMMENT ON POLICY "Admins can view all user profiles" ON public.user_profiles IS
  'Grants read-only access to all user profiles for admin users. Uses is_admin_user() SECURITY DEFINER function to avoid RLS recursion.';

COMMENT ON POLICY "Admins can view all blueprints" ON public.blueprint_generator IS
  'Grants read-only access to all blueprints for admin users. Uses is_admin_user() SECURITY DEFINER function to avoid RLS recursion.';

COMMENT ON POLICY "Admins can view all api usage logs" ON public.api_usage_logs IS
  'Grants read-only access to all API usage logs for admin users. Uses is_admin_user() SECURITY DEFINER function to avoid RLS recursion.';

-- =====================================================
-- 5. TECHNICAL NOTES
-- =====================================================

-- HOW THIS AVOIDS RECURSION:
--
-- The original policy had this pattern:
--   EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND ...)
--
-- This caused infinite recursion because:
-- 1. User tries to access user_profiles
-- 2. RLS checks policy which queries user_profiles
-- 3. That query triggers RLS again, which queries user_profiles
-- 4. Infinite loop!
--
-- The SECURITY DEFINER function approach:
-- 1. Function is marked SECURITY DEFINER, so it runs with the privileges of the function creator
-- 2. This means it bypasses RLS when querying user_profiles
-- 3. No recursion occurs because the function doesn't trigger RLS policies
-- 4. The policy simply calls: is_admin_user()
-- 5. PostgreSQL evaluates this once per query, not recursively
--
-- Security considerations:
-- - Function is carefully designed to only check admin status
-- - It doesn't return sensitive data
-- - It fails closed (returns FALSE) on any error
-- - It's granted only to authenticated users
--
-- =====================================================
-- 6. VERIFICATION
-- =====================================================

-- Test that the function works correctly
DO $$
BEGIN
  -- Should not raise any errors
  PERFORM public.is_admin_user();
  RAISE NOTICE 'Admin check function created successfully';
END $$;
