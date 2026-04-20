-- Migration: 20251025000000_add_developer_tier.sql
-- Description: Set developer tier for not.jitin@gmail.com with unlimited starmap generations and saves
-- Author: System
-- Date: 2025-10-25

BEGIN;

-- Set developer role for not.jitin@gmail.com
-- This gives unlimited starmap generations and saves
-- Note: Developer is now a role, not a tier
UPDATE user_profiles
SET
  subscription_tier = 'free',  -- Developers use free tier but have unlimited access via role
  user_role = 'developer',
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

-- Log the tier assignment in role_audit_log if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_audit_log') THEN
    INSERT INTO role_audit_log (
      admin_user_id,
      target_user_id,
      old_role,
      new_role,
      reason
    )
    SELECT
      up.user_id as admin_user_id, -- Self-assigned by system migration
      up.user_id as target_user_id,
      COALESCE(
        (SELECT old_role FROM role_audit_log WHERE target_user_id = up.user_id ORDER BY created_at DESC LIMIT 1),
        'explorer'
      ) as old_role,
      'developer' as new_role,
      'System migration: Developer tier assignment with unlimited access' as reason
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
    AND up.subscription_tier = 'developer'
    AND up.blueprint_creation_limit = -1
    AND up.blueprint_saving_limit = -1;

  IF updated_count = 0 THEN
    RAISE WARNING 'Developer tier not set for not.jitin@gmail.com - user may not exist yet';
  ELSE
    RAISE NOTICE 'Developer tier successfully set for not.jitin@gmail.com with unlimited limits';
  END IF;
END $$;

COMMIT;
