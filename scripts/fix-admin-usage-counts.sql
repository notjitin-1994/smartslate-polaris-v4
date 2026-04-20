-- Fix Admin Usage Counts - Comprehensive Diagnosis and Repair
-- Purpose: Diagnose and fix incorrect usage counts in admin users page
-- Date: 2025-11-06
--
-- This script performs the following:
-- 1. Diagnoses counter accuracy by comparing with actual blueprint data
-- 2. Identifies all users with mismatched counters
-- 3. Fixes the counters to match reality
-- 4. Provides detailed before/after statistics

-- =============================================================================
-- PHASE 1: DIAGNOSIS - Check Current State
-- =============================================================================

-- Check if backup table exists from previous backfill
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles_counter_backup_20251106') THEN
    RAISE NOTICE '✓ Backup table exists - previous backfill was attempted';
  ELSE
    RAISE NOTICE '⚠ Backup table missing - backfill may not have run';
  END IF;
END $$;

-- Count users with mismatched counters
WITH mismatch_check AS (
  SELECT
    up.user_id,
    up.blueprint_creation_count AS counter_creation,
    (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ) AS actual_creation,
    up.blueprint_saving_count AS counter_saving,
    (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ) AS actual_saving
  FROM user_profiles up
)
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE counter_creation != actual_creation) AS creation_mismatches,
  COUNT(*) FILTER (WHERE counter_saving != actual_saving) AS saving_mismatches,
  COUNT(*) FILTER (WHERE counter_creation != actual_creation OR counter_saving != actual_saving) AS users_with_any_mismatch
FROM mismatch_check;

-- Show detailed mismatch information
SELECT
  up.user_id,
  up.email,
  up.subscription_tier,
  up.blueprint_creation_count AS current_creation_counter,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS correct_creation_count,
  (up.blueprint_creation_count - (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  )) AS creation_delta,
  up.blueprint_saving_count AS current_saving_counter,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS correct_saving_count,
  (up.blueprint_saving_count - (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  )) AS saving_delta
FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.user_id
WHERE up.blueprint_creation_count != (
  SELECT COUNT(*)
  FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.dynamic_questions IS NOT NULL
    AND bg.deleted_at IS NULL
)
OR up.blueprint_saving_count != (
  SELECT COUNT(*)
  FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.blueprint_json IS NOT NULL
    AND bg.deleted_at IS NULL
)
ORDER BY ABS(creation_delta) + ABS(saving_delta) DESC
LIMIT 20;

-- =============================================================================
-- PHASE 2: FIX - Update All User Counters to Match Reality
-- =============================================================================

-- Create a temporary table to store the fixes
CREATE TEMP TABLE counter_fixes AS
SELECT
  up.user_id,
  up.blueprint_creation_count AS old_creation_count,
  up.blueprint_saving_count AS old_saving_count,
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) AS new_creation_count,
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) AS new_saving_count
FROM user_profiles up;

-- Show what will be updated
SELECT
  COUNT(*) AS total_users_to_update,
  COUNT(*) FILTER (WHERE old_creation_count != new_creation_count) AS creation_updates,
  COUNT(*) FILTER (WHERE old_saving_count != new_saving_count) AS saving_updates,
  SUM(new_creation_count - old_creation_count) AS total_creation_delta,
  SUM(new_saving_count - old_saving_count) AS total_saving_delta
FROM counter_fixes
WHERE old_creation_count != new_creation_count
   OR old_saving_count != new_saving_count;

-- =============================================================================
-- UNCOMMMENT BELOW TO ACTUALLY FIX THE COUNTERS
-- =============================================================================
-- WARNING: This will update all user counters in the database
-- Review the diagnosis output above before uncommenting

/*
BEGIN;

-- Update all user counters
UPDATE user_profiles up
SET
  blueprint_creation_count = fixes.new_creation_count,
  blueprint_saving_count = fixes.new_saving_count,
  updated_at = NOW()
FROM counter_fixes fixes
WHERE up.user_id = fixes.user_id
  AND (up.blueprint_creation_count != fixes.new_creation_count
    OR up.blueprint_saving_count != fixes.new_saving_count);

-- Log the changes
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE '✓ Updated counters for % users', v_updated_count;
END $$;

COMMIT;

-- Verify the fix worked
SELECT
  COUNT(*) AS users_still_mismatched
FROM user_profiles up
WHERE up.blueprint_creation_count != (
  SELECT COUNT(*)
  FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.dynamic_questions IS NOT NULL
    AND bg.deleted_at IS NULL
)
OR up.blueprint_saving_count != (
  SELECT COUNT(*)
  FROM blueprint_generator bg
  WHERE bg.user_id = up.user_id
    AND bg.blueprint_json IS NOT NULL
    AND bg.deleted_at IS NULL
);

RAISE NOTICE '✓ Counter fix complete - verification above should show 0 mismatches';
*/

-- =============================================================================
-- PHASE 3: VERIFICATION - After Running the Fix
-- =============================================================================

-- Run this after uncommenting and running the fix above
-- Expected result: users_still_mismatched = 0

/*
SELECT
  COUNT(*) AS total_users_checked,
  COUNT(*) FILTER (WHERE
    up.blueprint_creation_count = (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    )
    AND up.blueprint_saving_count = (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    )
  ) AS users_with_correct_counters,
  COUNT(*) FILTER (WHERE
    up.blueprint_creation_count != (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    )
    OR up.blueprint_saving_count != (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    )
  ) AS users_still_mismatched
FROM user_profiles up;
*/
