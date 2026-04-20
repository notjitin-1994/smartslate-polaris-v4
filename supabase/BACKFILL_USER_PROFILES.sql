-- ============================================================================
-- BACKFILL USER PROFILES FROM AUTH.USERS
-- ============================================================================
-- Description: This script backfills user_profiles table with all users from
--              auth.users that don't already have a profile.
-- Purpose: One-time operation to ensure all authenticated users have profiles
-- Date: 2025-11-04
-- IMPORTANT: This is a one-time backfill script. Run this in Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- First, let's see how many users need to be backfilled
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = au.id
  );

  RAISE NOTICE 'Users missing profiles: %', missing_count;
END $$;

-- Now, backfill all missing user profiles with default values
INSERT INTO public.user_profiles (
  user_id,
  full_name,
  email,
  avatar_url,
  user_role,
  subscription_tier,
  blueprint_creation_count,
  blueprint_creation_limit,
  blueprint_saving_count,
  blueprint_saving_limit,
  preferences,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  au.id AS user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', NULL) AS full_name,
  au.email AS email,
  COALESCE(au.raw_user_meta_data->>'avatar_url', NULL) AS avatar_url,
  'user' AS user_role, -- Default role for all backfilled users
  'free' AS subscription_tier, -- Default tier for all backfilled users
  0 AS blueprint_creation_count,
  2 AS blueprint_creation_limit, -- Free tier limit
  0 AS blueprint_saving_count,
  2 AS blueprint_saving_limit, -- Free tier limit
  '{}'::jsonb AS preferences,
  au.created_at AS created_at,
  au.updated_at AS updated_at,
  NULL AS deleted_at -- All backfilled users are active
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up
  WHERE up.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING; -- Skip if profile already exists

-- Report how many profiles were created
DO $$
DECLARE
  total_count INTEGER;
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM auth.users;
  SELECT COUNT(*) INTO backfilled_count FROM public.user_profiles;

  RAISE NOTICE 'Total auth users: %', total_count;
  RAISE NOTICE 'Total user profiles: %', backfilled_count;
  RAISE NOTICE 'Backfill completed successfully!';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the backfill)
-- ============================================================================

-- 1. Check if any users are still missing profiles
-- SELECT COUNT(*) as missing_profiles
-- FROM auth.users au
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.user_profiles up
--   WHERE up.user_id = au.id
-- );

-- 2. View newly created profiles
-- SELECT
--   up.user_id,
--   up.email,
--   up.full_name,
--   up.user_role,
--   up.subscription_tier,
--   up.created_at
-- FROM public.user_profiles up
-- ORDER BY up.created_at DESC
-- LIMIT 20;

-- 3. Compare counts
-- SELECT
--   (SELECT COUNT(*) FROM auth.users) as auth_users_count,
--   (SELECT COUNT(*) FROM public.user_profiles) as profiles_count;
