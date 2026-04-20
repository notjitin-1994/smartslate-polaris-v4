-- Migration: 20251102000000_populate_user_profile_names_and_email.sql
-- Description: Update handle_new_user trigger to populate first_name, last_name, and email
--              Also backfill existing user_profiles with data from auth.users
-- Author: System
-- Date: 2025-11-02

BEGIN;

-- ============================================================================
-- 1. Update the handle_new_user trigger to populate name and email fields
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    subscription_tier,
    user_role,
    subscription_metadata,
    role_assigned_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'explorer',
    'explorer',
    jsonb_build_object(
      'plan_id', 'explorer',
      'billing_cycle', 'monthly',
      'started_at', NEW.created_at,
      'renewal_date', NEW.created_at + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', 5,
        'max_saved_starmaps', 5
      )
    ),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.user_profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record with email, first_name, and last_name when a new auth user is created';

-- ============================================================================
-- 2. Backfill existing user_profiles with email from auth.users
-- ============================================================================

-- Update email for existing records that don't have it
UPDATE public.user_profiles up
SET
  email = au.email,
  updated_at = NOW()
FROM auth.users au
WHERE up.user_id = au.id
  AND au.email IS NOT NULL
  AND (up.email IS NULL OR up.email = '');

-- ============================================================================
-- 3. Backfill existing user_profiles with first_name, last_name from auth.users metadata
-- ============================================================================

-- Update first_name, last_name, and full_name from auth.users raw_user_meta_data
UPDATE public.user_profiles up
SET
  first_name = COALESCE(
    NULLIF(up.first_name, ''),
    au.raw_user_meta_data->>'first_name',
    split_part(au.raw_user_meta_data->>'full_name', ' ', 1),
    split_part(up.full_name, ' ', 1)
  ),
  last_name = COALESCE(
    NULLIF(up.last_name, ''),
    au.raw_user_meta_data->>'last_name',
    CASE
      WHEN array_length(string_to_array(au.raw_user_meta_data->>'full_name', ' '), 1) > 1
      THEN array_to_string((string_to_array(au.raw_user_meta_data->>'full_name', ' '))[2:], ' ')
      WHEN array_length(string_to_array(up.full_name, ' '), 1) > 1
      THEN array_to_string((string_to_array(up.full_name, ' '))[2:], ' ')
      ELSE ''
    END
  ),
  updated_at = NOW()
FROM auth.users au
WHERE up.user_id = au.id
  AND (
    up.first_name IS NULL
    OR up.first_name = ''
    OR up.last_name IS NULL
    OR up.last_name = ''
  );

-- ============================================================================
-- 4. Ensure full_name is computed correctly for all records
-- ============================================================================

-- The update_full_name trigger should handle this, but let's ensure existing records are correct
UPDATE public.user_profiles
SET
  full_name = trim(concat(coalesce(first_name, ''), ' ', coalesce(last_name, ''))),
  updated_at = NOW()
WHERE
  full_name IS NULL
  OR full_name = ''
  OR full_name != trim(concat(coalesce(first_name, ''), ' ', coalesce(last_name, '')));

COMMIT;

-- ============================================================================
-- Verification Queries (run after migration to verify)
-- ============================================================================

-- Check how many profiles have email populated
-- SELECT
--   COUNT(*) as total_profiles,
--   COUNT(email) as profiles_with_email,
--   COUNT(*) - COUNT(email) as profiles_missing_email
-- FROM public.user_profiles;

-- Check how many profiles have first_name and last_name populated
-- SELECT
--   COUNT(*) as total_profiles,
--   COUNT(first_name) as profiles_with_first_name,
--   COUNT(last_name) as profiles_with_last_name,
--   COUNT(full_name) as profiles_with_full_name
-- FROM public.user_profiles;

-- Sample records to verify data quality
-- SELECT
--   up.user_id,
--   up.email,
--   up.first_name,
--   up.last_name,
--   up.full_name,
--   au.email as auth_email,
--   au.raw_user_meta_data->>'first_name' as auth_first_name,
--   au.raw_user_meta_data->>'last_name' as auth_last_name,
--   au.raw_user_meta_data->>'full_name' as auth_full_name
-- FROM public.user_profiles up
-- JOIN auth.users au ON up.user_id = au.id
-- LIMIT 10;
