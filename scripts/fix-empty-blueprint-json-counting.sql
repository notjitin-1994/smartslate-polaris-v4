-- ====================================================================
-- FIX: Exclude Empty blueprint_json Objects from Saving Count
-- ====================================================================
-- Bug: blueprint_json = '{}' (empty object) is counted as "saved"
-- Fix: Only count blueprints with actual blueprint_json content
-- ====================================================================

-- STEP 1: Update ALL user counters with correct logic
-- ====================================================================
UPDATE user_profiles up
SET
  blueprint_creation_count = (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.dynamic_questions != '{}'::jsonb  -- Exclude empty objects
      AND bg.deleted_at IS NULL
  ),
  blueprint_saving_count = (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.blueprint_json != '{}'::jsonb  -- ✅ FIX: Exclude empty objects
      AND bg.deleted_at IS NULL
  ),
  blueprint_usage_metadata = jsonb_set(
    jsonb_set(
      COALESCE(up.blueprint_usage_metadata, '{}'::jsonb),
      '{last_counter_backfill}',
      to_jsonb(NOW()::TEXT)
    ),
    '{backfill_reason}',
    '"Fixed counting logic to exclude empty blueprint_json objects"'::jsonb
  ),
  updated_at = NOW();

SELECT '✅ All user counters updated with correct logic' AS status;

-- STEP 2: Verify test2 user is now correct
-- ====================================================================
SELECT
  '🎯 test2@smartslate.io Verification' AS status,
  blueprint_creation_count AS counter_creation,
  blueprint_saving_count AS counter_saving,
  CASE
    WHEN blueprint_creation_count = 1 AND blueprint_saving_count = 0
    THEN '✅ CORRECT (1 created, 0 saved)'
    ELSE '❌ STILL WRONG'
  END AS result
FROM user_profiles
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 3: Test API function
-- ====================================================================
SELECT
  '🔌 API Function Test' AS status,
  creation_count,
  saving_count,
  CASE
    WHEN creation_count = 1 AND saving_count = 0
    THEN '✅ API CORRECT (1, 0)'
    ELSE '❌ API WRONG'
  END AS result
FROM get_blueprint_usage_info('515784ac-92ee-489f-88a8-c8bc7d67fc33'::UUID);

-- STEP 4: Show summary of all users affected
-- ====================================================================
SELECT
  '📊 Impact Summary' AS status,
  COUNT(*) AS total_blueprints,
  COUNT(*) FILTER (WHERE blueprint_json IS NOT NULL) AS has_any_blueprint_json,
  COUNT(*) FILTER (WHERE blueprint_json IS NOT NULL AND blueprint_json = '{}'::jsonb) AS has_empty_blueprint_json,
  COUNT(*) FILTER (WHERE blueprint_json IS NOT NULL AND blueprint_json != '{}'::jsonb) AS has_real_blueprint_json
FROM blueprint_generator
WHERE deleted_at IS NULL;

-- This shows how many blueprints were incorrectly counted as "saved"

-- ====================================================================
-- SUCCESS CRITERIA
-- ====================================================================
-- After running this script:
--
-- 1. ✅ All user counters updated with correct logic
-- 2. 🎯 test2 user: ✅ CORRECT (1 created, 0 saved)
-- 3. 🔌 API returns: ✅ API CORRECT (1, 0)
-- 4. 📊 Impact summary shows how many empty objects existed
--
-- Then in browser:
-- 5. Hard refresh (Ctrl+Shift+R)
-- 6. Should show: Generated 1 / Saved 0 ✅
-- ====================================================================
