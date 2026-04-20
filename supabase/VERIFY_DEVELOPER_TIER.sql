-- ============================================================================
-- VERIFICATION: Check Developer Tier for not.jitin@gmail.com
-- ============================================================================
-- Run this in Supabase SQL Editor to verify the migration worked
-- ============================================================================

SELECT
  au.email,
  up.subscription_tier,
  up.user_role,
  up.blueprint_creation_count,
  up.blueprint_creation_limit,
  up.blueprint_saving_count,
  up.blueprint_saving_limit,
  up.blueprint_usage_metadata->>'exempt_from_limits' as exempt_from_limits,
  up.blueprint_usage_metadata->>'exemption_reason' as exemption_reason,
  up.subscription_metadata,
  up.role_assigned_at
FROM user_profiles up
INNER JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'not.jitin@gmail.com';
