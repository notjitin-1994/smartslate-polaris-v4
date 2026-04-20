-- ====================================================================
-- FIX: Update get_blueprint_usage_info to Read from Counter Columns
-- ====================================================================
-- This script forcefully updates the function to use counter columns
-- as the single source of truth instead of counting actual blueprints
-- ====================================================================

-- STEP 1: Drop old helper functions if they still exist
-- ====================================================================
DROP FUNCTION IF EXISTS public.get_actual_blueprint_creation_count(UUID);
DROP FUNCTION IF EXISTS public.get_actual_blueprint_saving_count(UUID);

SELECT '✅ Old helper functions dropped' AS status;

-- STEP 2: Replace get_blueprint_usage_info with CORRECT version
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_blueprint_usage_info(p_user_id UUID)
RETURNS TABLE(
  creation_count INTEGER,
  saving_count INTEGER,
  creation_limit INTEGER,
  saving_limit INTEGER,
  is_exempt BOOLEAN,
  exemption_reason TEXT,
  last_creation TIMESTAMPTZ,
  last_saving TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_limits RECORD;
BEGIN
  -- Get effective limits (handles monthly resets, carryover, exemptions)
  SELECT * INTO v_effective_limits FROM get_effective_limits(p_user_id);

  -- ✅ CRITICAL: Read directly from COUNTER COLUMNS (single source of truth)
  RETURN QUERY
  SELECT
    -- Use counter columns directly - NOT counting actual blueprints
    up.blueprint_creation_count as creation_count,
    up.blueprint_saving_count as saving_count,
    -- Use effective limits (includes carryover calculations)
    v_effective_limits.creation_limit as creation_limit,
    v_effective_limits.saving_limit as saving_limit,
    -- Exemption status
    COALESCE((up.blueprint_usage_metadata->>'exempt_from_limits')::boolean, false) as is_exempt,
    up.blueprint_usage_metadata->>'exemption_reason' as exemption_reason,
    -- Last timestamps from metadata
    (up.blueprint_usage_metadata->>'last_blueprint_created')::TIMESTAMPTZ as last_creation,
    (up.blueprint_usage_metadata->>'last_blueprint_saved')::TIMESTAMPTZ as last_saving
  FROM user_profiles up
  WHERE up.user_id = p_user_id;

  -- If no user found, return defaults
  IF NOT FOUND THEN
    RAISE NOTICE 'User profile not found for user_id: %', p_user_id;

    RETURN QUERY
    SELECT
      0::INTEGER as creation_count,
      0::INTEGER as saving_count,
      0::INTEGER as creation_limit,
      0::INTEGER as saving_limit,
      false as is_exempt,
      NULL::TEXT as exemption_reason,
      NULL::TIMESTAMPTZ as last_creation,
      NULL::TIMESTAMPTZ as last_saving;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_blueprint_usage_info IS
'✅ COUNTER-BASED VERSION: Returns blueprint usage info using counter columns as the single source of truth.
Called by frontend API endpoints to display current usage.
Counters (blueprint_creation_count, blueprint_saving_count) are incremented atomically
by increment_blueprint_creation_count_v2 and increment_blueprint_saving_count_v2.
Updated: 2025-11-06 to fix API returning wrong values after backfill.';

SELECT '✅ Function replaced with counter-based version' AS status;

-- STEP 3: Verify the fix worked
-- ====================================================================

-- Test with test2 user
SELECT
  '🧪 Testing with test2@smartslate.io' AS status;

SELECT * FROM get_blueprint_usage_info('515784ac-92ee-489f-88a8-c8bc7d67fc33'::UUID);

-- This should now return:
-- creation_count: 1
-- saving_count: 0  (NOT 1!)

-- Compare with actual counter values
SELECT
  '🔍 Actual counter values in database' AS status;

SELECT
  blueprint_creation_count,
  blueprint_saving_count,
  '(should match API result above)' AS note
FROM user_profiles
WHERE user_id = '515784ac-92ee-489f-88a8-c8bc7d67fc33';

-- STEP 4: Show function definition for verification
-- ====================================================================
SELECT
  '📜 New function definition (verify it uses counter columns)' AS status;

SELECT pg_get_functiondef('public.get_blueprint_usage_info(uuid)'::regprocedure);

-- Look for "up.blueprint_creation_count" in the output - this confirms
-- the function is reading from counters, not counting actual blueprints

-- ====================================================================
-- SUCCESS CRITERIA
-- ====================================================================
-- After running this script:
--
-- 1. ✅ Old helper functions dropped
-- 2. ✅ Function replaced with counter-based version
-- 3. 🧪 API returns creation_count=1, saving_count=0 (NOT 1!)
-- 4. 🔍 Counter values match API result
-- 5. 📜 Function definition contains "up.blueprint_creation_count"
--
-- Then in browser:
-- 6. Hard refresh (Ctrl+Shift+R)
-- 7. Should show: Generated 1 / Saved 0 ✅
-- ====================================================================
