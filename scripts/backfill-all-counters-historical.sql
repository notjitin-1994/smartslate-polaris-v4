-- ====================================================================
-- HISTORICAL COUNTER BACKFILL - Run in Supabase SQL Editor
-- ====================================================================
-- This script updates ALL user counters to match ACTUAL blueprint data
-- Ensures 100% historical accuracy across all users
--
-- SAFE TO RUN: Creates backup before making changes
-- ====================================================================

-- STEP 1: Create Safety Backup
-- ====================================================================
DROP TABLE IF EXISTS user_profiles_counter_backup_manual CASCADE;

CREATE TABLE user_profiles_counter_backup_manual AS
SELECT
  user_id,
  email,
  blueprint_creation_count,
  blueprint_saving_count,
  updated_at,
  NOW() AS backup_created_at
FROM user_profiles;

SELECT
  '✅ Backup created: ' || COUNT(*) || ' users backed up' AS status
FROM user_profiles_counter_backup_manual;

-- STEP 2: Show BEFORE State (Current Mismatches)
-- ====================================================================
WITH accuracy_check AS (
  SELECT
    up.user_id,
    up.email,
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
  COUNT(*) FILTER (
    WHERE counter_creation != actual_creation
       OR counter_saving != actual_saving
  ) AS users_with_mismatches,
  SUM(counter_creation - actual_creation) AS total_creation_delta,
  SUM(counter_saving - actual_saving) AS total_saving_delta
FROM accuracy_check;

-- STEP 3: Show Sample Mismatches (Top 20)
-- ====================================================================
WITH accuracy_check AS (
  SELECT
    up.user_id,
    up.email,
    up.subscription_tier,
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
  SUBSTRING(user_id::TEXT, 1, 8) || '...' AS user_id_short,
  COALESCE(email, 'no email') AS email,
  subscription_tier AS tier,
  counter_creation || ' → ' || actual_creation AS creation_fix,
  counter_saving || ' → ' || actual_saving AS saving_fix,
  (counter_creation - actual_creation) AS creation_delta,
  (counter_saving - actual_saving) AS saving_delta
FROM accuracy_check
WHERE counter_creation != actual_creation
   OR counter_saving != actual_saving
ORDER BY ABS(counter_creation - actual_creation) + ABS(counter_saving - actual_saving) DESC
LIMIT 20;

-- ====================================================================
-- READY TO FIX? Copy the section below and run it separately
-- ====================================================================

-- STEP 4: UPDATE ALL COUNTERS (Run this after reviewing above)
-- ====================================================================

UPDATE user_profiles up
SET
  blueprint_creation_count = (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ),
  blueprint_saving_count = (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ),
  blueprint_usage_metadata = jsonb_set(
    jsonb_set(
      COALESCE(up.blueprint_usage_metadata, '{}'::jsonb),
      '{last_counter_backfill}',
      to_jsonb(NOW()::TEXT)
    ),
    '{backfill_reason}',
    '"Historical accuracy correction - all counters updated"'::jsonb
  ),
  updated_at = NOW();

-- Show update result
SELECT
  '✅ Update complete: ' || COUNT(*) || ' users updated' AS status
FROM user_profiles;

-- STEP 5: Verify 100% Accuracy (After Update)
-- ====================================================================
WITH accuracy_check AS (
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
  COUNT(*) FILTER (
    WHERE counter_creation = actual_creation
      AND counter_saving = actual_saving
  ) AS accurate_users,
  COUNT(*) FILTER (
    WHERE counter_creation != actual_creation
       OR counter_saving != actual_saving
  ) AS remaining_mismatches,
  ROUND(
    COUNT(*) FILTER (
      WHERE counter_creation = actual_creation
        AND counter_saving = actual_saving
    )::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS accuracy_percentage
FROM accuracy_check;

-- Expected result: remaining_mismatches = 0, accuracy_percentage = 100.00

-- ====================================================================
-- ROLLBACK (Only if something went wrong)
-- ====================================================================
-- Restore from backup:
--
-- UPDATE user_profiles up
-- SET
--   blueprint_creation_count = backup.blueprint_creation_count,
--   blueprint_saving_count = backup.blueprint_saving_count,
--   updated_at = NOW()
-- FROM user_profiles_counter_backup_manual backup
-- WHERE up.user_id = backup.user_id;
--
-- DROP TABLE user_profiles_counter_backup_manual;
