-- ====================================================================
-- Simple Diagnosis - Which Version of get_blueprint_usage_info is Active
-- ====================================================================

-- STEP 1: Check the current function definition
-- ====================================================================
SELECT pg_get_functiondef('public.get_blueprint_usage_info(uuid)'::regprocedure) AS function_definition;

-- Look for these keywords in the output:
-- ❌ BAD (old version): "get_actual_blueprint_creation_count" or "get_actual_blueprint_saving_count"
-- ✅ GOOD (new version): "up.blueprint_creation_count" and "up.blueprint_saving_count"

-- STEP 2: Test what the function returns
-- ====================================================================
SELECT
  'API Function Returns' AS test,
  creation_count,
  saving_count
FROM get_blueprint_usage_info('515784ac-92ee-489f-88a8-c8bc7d67fc33'::UUID);

-- STEP 3: Check actual counter values in database
-- ====================================================================
SELECT
  'Database Counter Values' AS test,
  blueprint_creation_count AS creation_count,
  blueprint_saving_count AS saving_count
FROM user_profiles
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- ====================================================================
-- COMPARISON
-- ====================================================================
-- If STEP 2 (API) returns (1, 1) but STEP 3 (Database) shows (1, 0):
--   → Function is NOT reading from counters
--   → It's counting actual blueprints
--   → Need to run fix-get-blueprint-usage-info-function.sql
--
-- If STEP 2 and STEP 3 both show (1, 0):
--   → Function is already fixed!
--   → Just need to hard refresh browser
-- ====================================================================
