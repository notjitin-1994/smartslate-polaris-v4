-- ====================================================================
-- Diagnosis for test2@smartslate.io User
-- ====================================================================
-- User ID: 515784ac-92ee-489f-88a8-c8bc7d67fc33
-- Issue: counter_creation = 1, counter_saving = 1 (should be 1, 0)
-- ====================================================================

-- STEP 1: Check actual blueprint data
-- ====================================================================
SELECT
  id,
  created_at,
  status,
  CASE WHEN dynamic_questions IS NOT NULL THEN 'YES' ELSE 'NO' END AS has_dynamic_questions,
  CASE WHEN blueprint_json IS NOT NULL THEN 'YES' ELSE 'NO' END AS has_blueprint_json,
  deleted_at
FROM blueprint_generator
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33'
ORDER BY created_at DESC;

-- STEP 2: Count actual blueprints
-- ====================================================================
SELECT
  COUNT(*) FILTER (
    WHERE dynamic_questions IS NOT NULL AND deleted_at IS NULL
  ) AS actual_created_count,
  COUNT(*) FILTER (
    WHERE blueprint_json IS NOT NULL AND deleted_at IS NULL
  ) AS actual_saved_count
FROM blueprint_generator
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 3: Check backfill metadata
-- ====================================================================
SELECT
  blueprint_usage_metadata->>'last_counter_backfill' AS last_backfill,
  blueprint_usage_metadata->>'backfill_reason' AS backfill_reason,
  blueprint_usage_metadata,
  updated_at
FROM user_profiles
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 4: Check if backup table exists
-- ====================================================================
SELECT
  blueprint_creation_count,
  blueprint_saving_count,
  backup_created_at
FROM user_profiles_counter_backup_20251106_historical
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- ====================================================================
-- DIAGNOSIS SUMMARY
-- ====================================================================
-- If STEP 1 shows only blueprints with dynamic_questions but NO blueprint_json:
--   → Correct values should be: creation=1, saving=0
--   → Current values are: creation=1, saving=1 ❌
--   → Backfill failed to fix this user
--
-- If STEP 3 shows NULL for last_backfill:
--   → Backfill was NEVER run for this user
--
-- If STEP 4 returns no rows:
--   → Backup table doesn't exist, meaning backfill migration wasn't run
-- ====================================================================
