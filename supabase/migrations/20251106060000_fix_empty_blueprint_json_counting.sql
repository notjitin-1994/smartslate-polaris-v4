-- Migration: Fix Empty blueprint_json Counting
-- Purpose: Exclude empty '{}' objects from saving_count
-- Created: 2025-11-06
--
-- Bug: blueprint_json = '{}' (empty object) was counted as "saved"
-- Fix: Only count blueprints with actual content (not empty objects)
--
-- This affects:
-- 1. Counter backfill/update queries
-- 2. get_blueprint_usage_info function (already correct, uses counters)
-- 3. Future backfills

BEGIN;

-- =============================================================================
-- PHASE 1: Update All User Counters with Correct Logic
-- =============================================================================

-- Update counters to exclude empty objects
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

-- =============================================================================
-- PHASE 2: Create Audit View for Verification
-- =============================================================================

CREATE OR REPLACE VIEW blueprint_json_audit AS
SELECT
  bg.id,
  bg.user_id,
  bg.status,
  bg.created_at,
  CASE
    WHEN bg.blueprint_json IS NULL THEN 'NULL'
    WHEN bg.blueprint_json = '{}'::jsonb THEN 'EMPTY_OBJECT'
    WHEN bg.blueprint_json = '[]'::jsonb THEN 'EMPTY_ARRAY'
    ELSE 'HAS_DATA'
  END AS blueprint_json_status,
  CASE
    WHEN bg.dynamic_questions IS NULL THEN 'NULL'
    WHEN bg.dynamic_questions = '{}'::jsonb THEN 'EMPTY_OBJECT'
    ELSE 'HAS_DATA'
  END AS dynamic_questions_status,
  bg.deleted_at IS NOT NULL AS is_deleted
FROM blueprint_generator bg;

COMMENT ON VIEW blueprint_json_audit IS
'Audit view to identify blueprints with empty JSON objects.
Use to verify that empty objects are not counted as "saved" or "created".';

GRANT SELECT ON blueprint_json_audit TO authenticated;

-- =============================================================================
-- PHASE 3: Verification
-- =============================================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_users_corrected INTEGER;
  v_empty_blueprint_json_count INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users FROM user_profiles;

  -- Count how many users had corrections applied
  SELECT COUNT(*) INTO v_users_corrected
  FROM user_profiles
  WHERE blueprint_usage_metadata->>'last_counter_backfill' IS NOT NULL;

  -- Count blueprints with empty blueprint_json
  SELECT COUNT(*) INTO v_empty_blueprint_json_count
  FROM blueprint_generator
  WHERE blueprint_json = '{}'::jsonb
    AND deleted_at IS NULL;

  RAISE NOTICE '=== FIX EMPTY BLUEPRINT_JSON COUNTING ===';
  RAISE NOTICE 'Total users: %', v_total_users;
  RAISE NOTICE 'Users updated: %', v_users_corrected;
  RAISE NOTICE 'Blueprints with empty blueprint_json: %', v_empty_blueprint_json_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All counters now exclude empty blueprint_json objects';
  RAISE NOTICE '✅ Audit view created: blueprint_json_audit';
END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check accuracy after fix
-- SELECT * FROM user_counter_accuracy_check WHERE status = 'MISMATCH';
-- Should return 0 rows

-- View blueprints with empty JSON
-- SELECT * FROM blueprint_json_audit
-- WHERE blueprint_json_status = 'EMPTY_OBJECT' OR dynamic_questions_status = 'EMPTY_OBJECT';

-- Summary of JSON statuses
-- SELECT
--   blueprint_json_status,
--   COUNT(*) as count
-- FROM blueprint_json_audit
-- WHERE NOT is_deleted
-- GROUP BY blueprint_json_status;
