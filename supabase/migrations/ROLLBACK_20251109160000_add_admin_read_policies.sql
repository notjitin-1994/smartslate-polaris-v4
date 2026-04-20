-- Rollback: Admin Read-Only Access Policies Migration
-- Removes admin read-only policies added in 20251109160000_add_admin_read_policies.sql
-- Created: 2025-11-09

-- =====================================================
-- REMOVE ADMIN READ POLICIES
-- =====================================================

-- Remove admin read policy from user_profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;

-- Remove admin read policy from blueprint_generator
DROP POLICY IF EXISTS "Admins can view all blueprints" ON public.blueprint_generator;

-- Remove admin read policy from api_usage_logs
DROP POLICY IF EXISTS "Admins can view all api usage logs" ON public.api_usage_logs;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After rollback, admins should only be able to see their own data
-- Test as admin user:
-- SELECT COUNT(*) FROM user_profiles; -- Should return 1 (only own profile)
-- SELECT COUNT(*) FROM blueprint_generator; -- Should return only own blueprints
-- SELECT COUNT(*) FROM api_usage_logs; -- Should return only own logs
