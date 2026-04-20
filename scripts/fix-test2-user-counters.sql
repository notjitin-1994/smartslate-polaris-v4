-- ====================================================================
-- Fix Counters for test2@smartslate.io
-- ====================================================================
-- User ID: 515784ac-92ee-489f-88a8-c8bc7d67fc33
-- This script manually fixes the counters for this specific user
-- ====================================================================

-- STEP 1: Verify current state (before fix)
-- ====================================================================
SELECT
  'BEFORE FIX' AS status,
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
  ) AS actual_saving
FROM user_profiles up
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 2: Apply the fix
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
    '"Manual fix for test2@smartslate.io - counters updated to match actual blueprint data"'::jsonb
  ),
  updated_at = NOW()
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 3: Verify the fix worked (after fix)
-- ====================================================================
SELECT
  'AFTER FIX' AS status,
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
    WHEN blueprint_creation_count = (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ) AND blueprint_saving_count = (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ) THEN '✅ ACCURATE'
    ELSE '❌ STILL WRONG'
  END AS validation_status
FROM user_profiles up
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 4: Test the frontend API function
-- ====================================================================
SELECT
  'API FUNCTION RESULT' AS status,
  *
FROM get_blueprint_usage_info('515784ac-92ee-489f-88a8-c8bc7d67fc33'::UUID);

-- ====================================================================
-- Expected Result After Running This Script:
-- ====================================================================
-- BEFORE FIX:  counter_creation=1, counter_saving=1, actual_creation=1, actual_saving=0
-- AFTER FIX:   counter_creation=1, counter_saving=0, actual_creation=1, actual_saving=0
-- validation_status: ✅ ACCURATE
-- ====================================================================
