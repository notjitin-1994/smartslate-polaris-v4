-- Script to assign developer role to both jitin@smartslate.io and jitin@testslate.io
-- This script can be used if the users already exist in the system

-- Method 1: If the users already exist, update their profiles directly
UPDATE public.user_profiles
SET
  user_role = 'developer',
  blueprint_creation_limit = -1,  -- Unlimited
  blueprint_saving_limit = -1,    -- Unlimited
  blueprint_usage_metadata = jsonb_set(
    blueprint_usage_metadata,
    '{exempt_from_limits}',
    'true'::jsonb
  ),
  blueprint_usage_metadata = jsonb_set(
    blueprint_usage_metadata,
    '{exemption_reason}',
    '"Developer - jitin@smartslate.io - Unlimited blueprint access"'::jsonb
  ),
  role_assigned_at = NOW(),
  role_assigned_by = user_id
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'jitin@smartslate.io'
);

UPDATE public.user_profiles
SET
  user_role = 'developer',
  blueprint_creation_limit = -1,  -- Unlimited
  blueprint_saving_limit = -1,    -- Unlimited
  blueprint_usage_metadata = jsonb_set(
    blueprint_usage_metadata,
    '{exempt_from_limits}',
    'true'::jsonb
  ),
  blueprint_usage_metadata = jsonb_set(
    blueprint_usage_metadata,
    '{exemption_reason}',
    '"Developer - jitin@testslate.io - Unlimited blueprint access"'::jsonb
  ),
  role_assigned_at = NOW(),
  role_assigned_by = user_id
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'jitin@testslate.io'
);

-- Method 2: Use the helper function (preferred)
-- Assign to both users at once
SELECT public.assign_developer_role_to_emails(ARRAY['jitin@smartslate.io', 'jitin@testslate.io']);

-- Or assign individually
-- SELECT public.assign_developer_role('jitin@smartslate.io');
-- SELECT public.assign_developer_role('jitin@testslate.io');

-- Verify the assignments
SELECT
  u.email,
  up.user_role,
  up.blueprint_creation_limit,
  up.blueprint_saving_limit,
  up.blueprint_usage_metadata->'exemption_reason' as exemption_reason,
  up.role_assigned_at
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email IN ('jitin@smartslate.io', 'jitin@testslate.io')
ORDER BY u.email;