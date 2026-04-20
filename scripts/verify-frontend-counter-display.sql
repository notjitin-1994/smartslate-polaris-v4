-- ====================================================================
-- Frontend Counter Display Verification Script
-- ====================================================================
-- This script helps diagnose why frontend still shows incorrect values
-- after running the historical backfill.
--
-- Run this in Supabase SQL Editor to troubleshoot the issue.
-- ====================================================================

-- STEP 1: Check the actual counter values in the database
-- ====================================================================
SELECT
  user_id,
  email,
  subscription_tier,
  blueprint_creation_count AS counter_creation,
  blueprint_saving_count AS counter_saving,
  blueprint_usage_metadata,
  updated_at
FROM user_profiles
-- Replace with the specific user's email or ID
WHERE email ILIKE '%test%' OR email ILIKE '%jitin%'
ORDER BY updated_at DESC
LIMIT 10;

-- STEP 2: Verify what the frontend API actually returns
-- ====================================================================
-- This calls the EXACT same function the frontend uses
SELECT * FROM get_blueprint_usage_info('<replace-with-user-id>'::UUID);

-- STEP 3: Check actual blueprint data for comparison
-- ====================================================================
WITH user_blueprints AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE dynamic_questions IS NOT NULL AND deleted_at IS NULL) AS actual_created,
    COUNT(*) FILTER (WHERE blueprint_json IS NOT NULL AND deleted_at IS NULL) AS actual_saved
  FROM blueprint_generator
  WHERE user_id = '<replace-with-user-id>'::UUID
  GROUP BY user_id
)
SELECT
  up.user_id,
  up.email,
  up.blueprint_creation_count AS counter_creation,
  COALESCE(ub.actual_created, 0) AS actual_creation,
  up.blueprint_saving_count AS counter_saving,
  COALESCE(ub.actual_saved, 0) AS actual_saving,
  CASE
    WHEN up.blueprint_creation_count = COALESCE(ub.actual_created, 0)
     AND up.blueprint_saving_count = COALESCE(ub.actual_saved, 0)
    THEN '✅ ACCURATE'
    ELSE '❌ MISMATCH'
  END AS status
FROM user_profiles up
LEFT JOIN user_blueprints ub ON up.user_id = ub.user_id
WHERE up.user_id = '<replace-with-user-id>'::UUID;

-- STEP 4: Check if backfill metadata was written
-- ====================================================================
SELECT
  user_id,
  email,
  blueprint_usage_metadata->>'last_counter_backfill' AS last_backfill,
  blueprint_usage_metadata->>'backfill_reason' AS backfill_reason,
  updated_at
FROM user_profiles
WHERE user_id = '<replace-with-user-id>'::UUID;

-- STEP 5: Check ALL users to see if backfill ran
-- ====================================================================
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE blueprint_usage_metadata->>'last_counter_backfill' IS NOT NULL) AS users_backfilled,
  MAX((blueprint_usage_metadata->>'last_counter_backfill')::TIMESTAMPTZ) AS most_recent_backfill
FROM user_profiles;

-- ====================================================================
-- DIAGNOSIS GUIDE
-- ====================================================================
--
-- If STEP 1 shows incorrect counters:
--   → Backfill didn't run successfully or was rolled back
--   → Re-run the backfill script
--
-- If STEP 1 shows correct counters BUT STEP 2 returns wrong values:
--   → The get_blueprint_usage_info function is broken
--   → Check migration 20251106010000 was applied
--
-- If STEP 1 and STEP 2 show correct values BUT frontend shows wrong:
--   → Browser cache issue
--   → Try hard refresh: Ctrl+Shift+R
--   → Click the refresh button in BlueprintUsageDisplay component
--   → Clear browser cache completely
--
-- If STEP 3 shows MISMATCH status:
--   → Backfill needs to be re-run for this user
--   → Run the UPDATE query from backfill script
--
-- If STEP 4 shows NULL for last_backfill:
--   → Backfill was never executed
--   → Run the backfill migration or script
--
-- If STEP 5 shows 0 users_backfilled:
--   → Backfill migration was not run
--   → Execute migration 20251106050000 or manual script
--
-- ====================================================================
