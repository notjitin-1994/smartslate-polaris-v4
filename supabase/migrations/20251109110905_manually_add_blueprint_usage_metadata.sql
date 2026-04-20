-- Migration: Manually Add blueprint_usage_metadata Column
-- Purpose: Directly add missing column that should have been created by migration 20251106030000
-- Created: 2025-11-09
--
-- This migration forcefully adds the blueprint_usage_metadata column to production
-- Issue: Previous migration 20251106030000 applied to shadow DB but not production
-- Root Cause: Column "blueprint_usage_metadata" does not exist (PostgreSQL error 42703)
--
-- This is a critical fix migration - must run on production database

BEGIN;

-- =============================================================================
-- PHASE 1: Add the Missing Column
-- =============================================================================

-- Add blueprint_usage_metadata column if it doesn't exist
-- Add blueprint_usage_metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'blueprint_usage_metadata'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN blueprint_usage_metadata JSONB DEFAULT '{
      "creation_reset_date": null,
      "saving_reset_date": null,
      "exempt_from_limits": false,
      "exemption_reason": null,
      "last_blueprint_created": null,
      "last_blueprint_saved": null
    }'::jsonb;

    RAISE NOTICE 'Added blueprint_usage_metadata column to user_profiles';
  ELSE
    RAISE NOTICE 'blueprint_usage_metadata column already exists - skipping';
  END IF;
END $$;

-- =============================================================================
-- PHASE 2: Update NULL Values
-- =============================================================================

-- Ensure no NULL values exist (should not happen with DEFAULT, but safety check)
UPDATE public.user_profiles
SET blueprint_usage_metadata = '{
  "creation_reset_date": null,
  "saving_reset_date": null,
  "exempt_from_limits": false,
  "exemption_reason": null,
  "last_blueprint_created": null,
  "last_blueprint_saved": null
}'::jsonb
WHERE blueprint_usage_metadata IS NULL;

-- =============================================================================
-- PHASE 3: Verification
-- =============================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_total_users INTEGER;
  v_users_with_metadata INTEGER;
  v_users_with_null INTEGER;
BEGIN
  -- Check if column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'blueprint_usage_metadata'
  ) INTO v_column_exists;

  IF NOT v_column_exists THEN
    RAISE EXCEPTION 'CRITICAL: blueprint_usage_metadata column still does not exist!';
  END IF;

  -- Count users
  SELECT COUNT(*) INTO v_total_users FROM user_profiles;

  SELECT COUNT(*) INTO v_users_with_metadata
  FROM user_profiles
  WHERE blueprint_usage_metadata IS NOT NULL;

  SELECT COUNT(*) INTO v_users_with_null
  FROM user_profiles
  WHERE blueprint_usage_metadata IS NULL;

  RAISE NOTICE '=== VERIFICATION COMPLETE ===';
  RAISE NOTICE 'Column exists: %', v_column_exists;
  RAISE NOTICE 'Total users: %', v_total_users;
  RAISE NOTICE 'Users with metadata: %', v_users_with_metadata;
  RAISE NOTICE 'Users with NULL metadata: %', v_users_with_null;
  RAISE NOTICE '';
  RAISE NOTICE ' SUCCESS: blueprint_usage_metadata column now exists in production!';
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
-- To rollback this migration:
--
-- ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS blueprint_usage_metadata;
