-- ====================================================================
-- Diagnose Which Version of get_blueprint_usage_info is Active
-- ====================================================================
-- This script checks which version of the function is currently in the database
-- ====================================================================

-- STEP 1: Check if the old helper functions still exist
-- ====================================================================
-- These functions should have been DROPPED by migration 20251106000000
SELECT
  '🔍 Checking for OLD helper functions (should NOT exist)' AS status;

SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname IN ('get_actual_blueprint_creation_count', 'get_actual_blueprint_saving_count')
  AND pronamespace = 'public'::regnamespace;

-- If this returns any rows, those functions STILL EXIST (BAD!)
-- If this returns no rows, those functions were properly dropped (GOOD!)

-- STEP 2: Check the current definition of get_blueprint_usage_info
-- ====================================================================
SELECT
  '🔍 Current definition of get_blueprint_usage_info' AS status;

SELECT pg_get_functiondef('public.get_blueprint_usage_info(uuid)'::regprocedure);

-- Look for this in the output:
-- ✅ CORRECT VERSION: Should contain "up.blueprint_creation_count" and "up.blueprint_saving_count"
-- ❌ OLD VERSION: Contains "get_actual_blueprint_creation_count" and "get_actual_blueprint_saving_count"

-- STEP 3: Check which migrations have been applied
-- ====================================================================
SELECT
  '🔍 Migration history (relevant migrations)' AS status;

SELECT
  version,
  name,
  inserted_at
FROM schema_migrations
WHERE version IN (
  '20251029010000',  -- OLD version that uses actual counts
  '20251106000000',  -- Dropped helper functions
  '20251106010000'   -- NEW version that uses counters
)
ORDER BY version;

-- Expected: All three should be present
-- If 20251106010000 is missing → NEW function was never applied!

-- STEP 4: Manual test - what does the function actually return?
-- ====================================================================
SELECT
  '🔍 Test function with test2 user' AS status;

-- This will tell us what the function is actually returning
SELECT * FROM get_blueprint_usage_info('515784ac-92ee-489f-88a8-c8bc7d67fc33'::UUID);

-- STEP 5: Manual test - what are the actual counter values?
-- ====================================================================
SELECT
  '🔍 Actual counter values in database' AS status;

SELECT
  blueprint_creation_count,
  blueprint_saving_count
FROM user_profiles
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- ====================================================================
-- DIAGNOSIS GUIDE
-- ====================================================================
--
-- If STEP 1 returns rows (functions exist):
--   → Migration 20251106000000 was NOT applied or was rolled back
--   → These old functions are still being called
--   → Need to drop them manually or re-run migration
--
-- If STEP 2 shows "get_actual_blueprint_creation_count" in definition:
--   → Function is using OLD version
--   → Migration 20251106010000 was NOT applied
--   → Need to manually update the function
--
-- If STEP 3 shows 20251106010000 is missing:
--   → Migration was never run
--   → Need to apply it manually
--
-- If STEP 4 returns (1, 1) but STEP 5 shows (1, 0):
--   → Function is bypassing counters and counting actual blueprints
--   → Confirms function needs to be updated
--
-- ====================================================================
