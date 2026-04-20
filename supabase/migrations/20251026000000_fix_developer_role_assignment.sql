-- Migration: 20251026000000_fix_developer_role_assignment.sql
-- Description: Fix developer role assignment for not.jitin@gmail.com with unlimited access
-- Author: System
-- Date: 2025-10-26

BEGIN;

-- Update user profile for not.jitin@gmail.com to have developer role with unlimited access
UPDATE public.user_profiles
SET
  user_role = 'developer',
  subscription_tier = 'free',  -- Developers use free tier but have unlimited access via role
  blueprint_creation_limit = -1, -- -1 means unlimited
  blueprint_saving_limit = -1,   -- -1 means unlimited
  blueprint_usage_metadata = jsonb_set(
    jsonb_set(
      COALESCE(blueprint_usage_metadata, '{}'::jsonb),
      '{exempt_from_limits}',
      'true'::jsonb
    ),
    '{exemption_reason}',
    '"Developer role - unlimited access"'::jsonb
  ),
  subscription_metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(subscription_metadata, '{}'::jsonb),
        '{limits,max_generations_monthly}',
        '-1'::jsonb
      ),
      '{limits,max_saved_starmaps}',
      '-1'::jsonb
    ),
    '{tier_name}',
    '"free"'::jsonb  -- Developer uses free tier
  ),
  role_assigned_at = NOW()
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com');

-- Log the role assignment in role_audit_log if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_audit_log') THEN
    INSERT INTO public.role_audit_log (
      admin_user_id,
      target_user_id,
      old_role,
      new_role,
      reason
    )
    SELECT
      up.user_id as admin_user_id, -- Self-assigned by system migration
      up.user_id as target_user_id,
      COALESCE(up.user_role, 'user') as old_role,
      'developer' as new_role,
      'System migration: Developer role assignment with unlimited access' as reason
    FROM user_profiles up
    WHERE up.user_id IN (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com');
  END IF;
END $$;

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM user_profiles up
  INNER JOIN auth.users au ON up.user_id = au.id
  WHERE au.email = 'not.jitin@gmail.com'
    AND up.user_role = 'developer'
    AND up.blueprint_creation_limit = -1
    AND up.blueprint_saving_limit = -1;

  IF updated_count = 0 THEN
    RAISE WARNING 'Developer role not set for not.jitin@gmail.com - user may not exist yet';
  ELSE
    RAISE NOTICE 'Developer role successfully set for not.jitin@gmail.com with unlimited limits';
  END IF;
END $$;

COMMIT;