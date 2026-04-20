-- ====================================================================
-- Fix ALL User Counters - Complete Backfill
-- ====================================================================
-- This script updates ALL users to have historically accurate counters
-- Run this entire script in Supabase SQL Editor
-- ====================================================================

-- STEP 1: Show current state (how many users are broken)
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
  '🔍 BEFORE FIX' AS status,
  COUNT(*) AS total_users,
  COUNT(*) FILTER (
    WHERE counter_creation != actual_creation
       OR counter_saving != actual_saving
  ) AS users_with_wrong_counters,
  SUM(counter_creation - actual_creation) AS total_creation_error,
  SUM(counter_saving - actual_saving) AS total_saving_error
FROM accuracy_check;

-- STEP 2: Create safety backup
-- ====================================================================
DROP TABLE IF EXISTS user_profiles_counter_backup_manual_fix CASCADE;

CREATE TABLE user_profiles_counter_backup_manual_fix AS
SELECT
  user_id,
  email,
  blueprint_creation_count,
  blueprint_saving_count,
  updated_at,
  NOW() AS backup_created_at
FROM user_profiles;

SELECT '✅ BACKUP CREATED' AS status, COUNT(*) || ' users backed up' AS result
FROM user_profiles_counter_backup_manual_fix;

-- STEP 3: Update ALL users to match actual blueprint data
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
    '"Complete backfill - all users updated to historical accuracy"'::jsonb
  ),
  updated_at = NOW();

SELECT '✅ UPDATE COMPLETE' AS status, COUNT(*) || ' users updated' AS result
FROM user_profiles;

-- STEP 4: Verify 100% accuracy
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
  '✅ AFTER FIX' AS status,
  COUNT(*) AS total_users,
  COUNT(*) FILTER (
    WHERE counter_creation = actual_creation
      AND counter_saving = actual_saving
  ) AS users_with_correct_counters,
  COUNT(*) FILTER (
    WHERE counter_creation != actual_creation
       OR counter_saving != actual_saving
  ) AS remaining_errors,
  ROUND(
    COUNT(*) FILTER (
      WHERE counter_creation = actual_creation
        AND counter_saving = actual_saving
    )::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    2
  ) AS accuracy_percentage
FROM accuracy_check;

-- Expected result: remaining_errors = 0, accuracy_percentage = 100.00

-- STEP 5: Verify test2 user specifically
-- ====================================================================
SELECT
  '🎯 TEST2 USER VERIFICATION' AS status,
  blueprint_creation_count AS counter_creation,
  blueprint_saving_count AS counter_saving,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_creation,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_saving,
  CASE
    WHEN blueprint_creation_count = 1 AND blueprint_saving_count = 0
    THEN '✅ CORRECT (1 generated, 0 saved)'
    ELSE '❌ STILL WRONG'
  END AS test2_status
FROM user_profiles up
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 6: Test the API function for test2 user
-- ====================================================================
SELECT
  '🔌 API FUNCTION TEST (test2)' AS status,
  creation_count,
  saving_count,
  CASE
    WHEN creation_count = 1 AND saving_count = 0
    THEN '✅ API RETURNS CORRECT VALUES'
    ELSE '❌ API STILL WRONG'
  END AS api_status
FROM get_blueprint_usage_info('515784ac-92ee-489f-88a8-c8bc7d67fc33'::UUID);

-- ====================================================================
-- SUCCESS CRITERIA
-- ====================================================================
-- After running this script, you should see:
--
-- 1. ✅ BACKUP CREATED: 25 users backed up
-- 2. ✅ UPDATE COMPLETE: 25 users updated
-- 3. ✅ AFTER FIX: remaining_errors = 0, accuracy_percentage = 100.00
-- 4. 🎯 TEST2 USER VERIFICATION: ✅ CORRECT (1 generated, 0 saved)
-- 5. 🔌 API FUNCTION TEST: ✅ API RETURNS CORRECT VALUES
--
-- Then:
-- 6. Hard refresh your browser (Ctrl+Shift+R)
-- 7. Frontend should show: Generated 1 / Saved 0
-- ====================================================================

-- ====================================================================
-- ROLLBACK (if something goes wrong)
-- ====================================================================
-- To restore from backup:
--
-- UPDATE user_profiles up
-- SET
--   blueprint_creation_count = backup.blueprint_creation_count,
--   blueprint_saving_count = backup.blueprint_saving_count,
--   updated_at = NOW()
-- FROM user_profiles_counter_backup_manual_fix backup
-- WHERE up.user_id = backup.user_id;
--
-- DROP TABLE user_profiles_counter_backup_manual_fix;
-- ====================================================================
