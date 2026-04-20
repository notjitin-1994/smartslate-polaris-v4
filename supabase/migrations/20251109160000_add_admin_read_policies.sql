-- Admin Read-Only Access Policies Migration
-- Grants admin roles read-only access to user data for reporting purposes
-- Created: 2025-11-09
-- Purpose: Allow admin reports to aggregate data across all users while maintaining write restrictions

-- =====================================================
-- 1. USER PROFILES - ADMIN READ ACCESS
-- =====================================================

-- Allow developers and admin roles to view ALL user profiles (read-only)
CREATE POLICY "Admins can view all user profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

-- Note: Existing policies for users to manage their own profiles remain unchanged
-- This only adds read access for admins, not write/update/delete

-- =====================================================
-- 2. BLUEPRINT GENERATOR - ADMIN READ ACCESS
-- =====================================================

-- Allow developers and admin roles to view ALL blueprints (read-only)
CREATE POLICY "Admins can view all blueprints"
  ON public.blueprint_generator
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

-- Note: Existing policies for users to manage their own blueprints remain unchanged
-- This only adds read access for admins, not write/update/delete

-- =====================================================
-- 3. API USAGE LOGS - FIX EXISTING ADMIN POLICY
-- =====================================================

-- The api_usage_logs table already has an admin policy, but it uses wrong column name
-- and limited roles. We need to drop and recreate it.

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all api usage logs" ON public.api_usage_logs;

-- Recreate with correct column name (user_id instead of id) and all admin roles
CREATE POLICY "Admins can view all api usage logs"
  ON public.api_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

-- Note: Existing policies for users to view their own logs remain unchanged
-- This fixes the existing admin policy to use correct column and expanded roles

-- =====================================================
-- 4. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Admins can view all user profiles" ON public.user_profiles IS
  'Grants read-only access to all user profiles for admin users with roles: developer, enterprise, armada, fleet, crew. Required for admin reporting and analytics.';

COMMENT ON POLICY "Admins can view all blueprints" ON public.blueprint_generator IS
  'Grants read-only access to all blueprints for admin users with roles: developer, enterprise, armada, fleet, crew. Required for admin reporting and analytics.';

COMMENT ON POLICY "Admins can view all api usage logs" ON public.api_usage_logs IS
  'Grants read-only access to all API usage logs for admin users with roles: developer, enterprise, armada, fleet, crew. Required for cost analysis and usage reporting.';

-- =====================================================
-- 5. SECURITY NOTES
-- =====================================================

-- IMPORTANT SECURITY CONSIDERATIONS:
-- 1. These policies ONLY grant SELECT (read) permissions
-- 2. Users still cannot modify other users' data (INSERT/UPDATE/DELETE remain restricted)
-- 3. Admin roles are: developer, enterprise, armada, fleet, crew
-- 4. Regular users (explorer, navigator, voyager) do NOT get cross-user access
-- 5. All admin access is logged via activity_logs table
-- 6. RLS policies are evaluated in combination - most restrictive wins for writes

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- To verify policies are working correctly, run these queries as an admin user:

-- Test 1: Count all users (should return total count)
-- SELECT COUNT(*) FROM user_profiles;

-- Test 2: Count all blueprints (should return total count)
-- SELECT COUNT(*) FROM blueprint_generator;

-- Test 3: Sum all API costs (should return total costs)
-- SELECT SUM(total_cost_cents) FROM api_usage_logs;

-- Test 4: Verify regular users still can't see other users' data
-- (Run as non-admin user - should only see own data)
