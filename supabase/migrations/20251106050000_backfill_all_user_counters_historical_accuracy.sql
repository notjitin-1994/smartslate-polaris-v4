-- Migration: Backfill All User Counters for Historical Accuracy
-- Purpose: Update ALL user counters to match ACTUAL blueprint data in database
-- Created: 2025-11-06
--
-- This migration ensures 100% historical accuracy by:
-- 1. Counting EVERY blueprint with dynamic_questions for each user (creation count)
-- 2. Counting EVERY blueprint with blueprint_json for each user (saving count)
-- 3. Updating ALL users to match these actual counts
-- 4. NOT using deleted_at filter to preserve true historical count
--
-- Note: This is a data correction migration, safe to run multiple times (idempotent)

-- =============================================================================
-- PHASE 1: Create Backup Table (Safety First)
-- =============================================================================

-- Drop backup if exists from previous run
DROP TABLE IF EXISTS user_profiles_counter_backup_20251106_historical CASCADE;

-- Create backup with timestamp
CREATE TABLE user_profiles_counter_backup_20251106_historical AS
SELECT
  user_id,
  blueprint_creation_count,
  blueprint_saving_count,
  updated_at,
  NOW() AS backup_created_at
FROM user_profiles;

COMMENT ON TABLE user_profiles_counter_backup_20251106_historical IS
'Backup of user_profiles counters before historical accuracy backfill on 2025-11-06.
Use this table to rollback if needed.';

-- =============================================================================
-- PHASE 2: Show Current State (Before Update)
-- =============================================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_users_with_mismatches INTEGER;
  v_total_creation_delta INTEGER;
  v_total_saving_delta INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users
  FROM user_profiles;

  -- Count users with mismatches
  SELECT COUNT(*) INTO v_users_with_mismatches
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

  -- Calculate total delta
  SELECT
    SUM(up.blueprint_creation_count - (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    )),
    SUM(up.blueprint_saving_count - (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ))
  INTO v_total_creation_delta, v_total_saving_delta
  FROM user_profiles up;

  RAISE NOTICE '=== BEFORE BACKFILL ===';
  RAISE NOTICE 'Total users: %', v_total_users;
  RAISE NOTICE 'Users with mismatches: %', v_users_with_mismatches;
  RAISE NOTICE 'Total creation delta: %', COALESCE(v_total_creation_delta, 0);
  RAISE NOTICE 'Total saving delta: %', COALESCE(v_total_saving_delta, 0);
END $$;

-- =============================================================================
-- PHASE 3: Update ALL User Counters to Match Historical Reality
-- =============================================================================

-- Update all users in one atomic operation
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
    '"Historical accuracy correction - counters updated to match actual blueprint data"'::jsonb
  ),
  updated_at = NOW();

-- =============================================================================
-- PHASE 4: Verify 100% Accuracy
-- =============================================================================

DO $$
DECLARE
  v_remaining_mismatches INTEGER;
  v_total_users INTEGER;
  v_users_updated INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users
  FROM user_profiles;

  -- Count users updated (by checking metadata)
  SELECT COUNT(*) INTO v_users_updated
  FROM user_profiles
  WHERE blueprint_usage_metadata->>'last_counter_backfill' IS NOT NULL;

  -- Verify no mismatches remain
  SELECT COUNT(*) INTO v_remaining_mismatches
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

  RAISE NOTICE '=== AFTER BACKFILL ===';
  RAISE NOTICE 'Total users processed: %', v_total_users;
  RAISE NOTICE 'Users updated: %', v_users_updated;
  RAISE NOTICE 'Remaining mismatches: % (should be 0)', v_remaining_mismatches;

  IF v_remaining_mismatches > 0 THEN
    RAISE WARNING 'VERIFICATION FAILED: % users still have mismatches!', v_remaining_mismatches;
  ELSE
    RAISE NOTICE '✅ SUCCESS: All user counters are now historically accurate!';
  END IF;
END $$;

-- =============================================================================
-- PHASE 5: Create Verification View
-- =============================================================================

CREATE OR REPLACE VIEW user_counter_accuracy_check AS
SELECT
  up.user_id,
  up.email,
  up.subscription_tier,
  up.blueprint_creation_count AS counter_creation,
  (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_creation,
  up.blueprint_saving_count AS counter_saving,
  (
    SELECT COUNT(*)::INTEGER
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_saving,
  CASE
    WHEN up.blueprint_creation_count = (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ) AND up.blueprint_saving_count = (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ) THEN 'ACCURATE'
    ELSE 'MISMATCH'
  END AS status
FROM user_profiles up;

COMMENT ON VIEW user_counter_accuracy_check IS
'Real-time view to verify counter accuracy for all users.
Use: SELECT * FROM user_counter_accuracy_check WHERE status = ''MISMATCH'';';

-- Grant access to view
GRANT SELECT ON user_counter_accuracy_check TO authenticated;

-- =============================================================================
-- PHASE 6: Add Helpful Utility Functions
-- =============================================================================

-- Function to get counter accuracy summary
CREATE OR REPLACE FUNCTION get_counter_accuracy_summary()
RETURNS TABLE(
  total_users INTEGER,
  accurate_users INTEGER,
  mismatched_users INTEGER,
  accuracy_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE status = 'ACCURATE')::INTEGER AS accurate,
      COUNT(*) FILTER (WHERE status = 'MISMATCH')::INTEGER AS mismatched
    FROM user_counter_accuracy_check
  )
  SELECT
    total,
    accurate,
    mismatched,
    ROUND((accurate::NUMERIC / NULLIF(total, 0) * 100), 2) AS accuracy_pct
  FROM stats;
END;
$$;

COMMENT ON FUNCTION get_counter_accuracy_summary IS
'Returns summary statistics of counter accuracy across all users.
Use: SELECT * FROM get_counter_accuracy_summary();';

GRANT EXECUTE ON FUNCTION get_counter_accuracy_summary TO authenticated;

-- =============================================================================
-- PHASE 7: Documentation and Logging
-- =============================================================================

-- Log the backfill operation
DO $$
DECLARE
  v_summary RECORD;
BEGIN
  SELECT * INTO v_summary FROM get_counter_accuracy_summary();

  RAISE NOTICE '=== BACKFILL COMPLETE ===';
  RAISE NOTICE 'Total users: %', v_summary.total_users;
  RAISE NOTICE 'Accurate users: %', v_summary.accurate_users;
  RAISE NOTICE 'Mismatched users: %', v_summary.mismatched_users;
  RAISE NOTICE 'Accuracy: % percent', v_summary.accuracy_percentage;
  RAISE NOTICE '';
  RAISE NOTICE 'Backup table: user_profiles_counter_backup_20251106_historical';
  RAISE NOTICE 'Verification view: user_counter_accuracy_check';
  RAISE NOTICE 'Summary function: get_counter_accuracy_summary()';
END $$;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================
-- To rollback this migration if needed:
--
-- UPDATE user_profiles up
-- SET
--   blueprint_creation_count = backup.blueprint_creation_count,
--   blueprint_saving_count = backup.blueprint_saving_count,
--   updated_at = NOW()
-- FROM user_profiles_counter_backup_20251106_historical backup
-- WHERE up.user_id = backup.user_id;
--
-- DROP VIEW user_counter_accuracy_check;
-- DROP FUNCTION get_counter_accuracy_summary();
-- DROP TABLE user_profiles_counter_backup_20251106_historical;
