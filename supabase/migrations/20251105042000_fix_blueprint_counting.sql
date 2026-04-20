-- Migration: 20251105040000_fix_blueprint_counting.sql
-- Description: Fix blueprint counting by syncing counters with actual database state
-- This migration fixes the dual counting bug where both creation and saving counts
-- were incremented when dynamic questions were generated.
-- Author: System
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- 1. Sync all user counters with actual database state
-- ============================================================================

-- Use the existing sync_blueprint_counters function to fix all users
DO $$
DECLARE
  v_sync_results RECORD;
  v_total_synced INTEGER := 0;
  v_total_mismatched INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting blueprint counter sync...';

  FOR v_sync_results IN
    SELECT * FROM sync_blueprint_counters()
  LOOP
    v_total_synced := v_total_synced + 1;

    IF NOT v_sync_results.counters_matched THEN
      v_total_mismatched := v_total_mismatched + 1;

      RAISE NOTICE 'Synced user %: creation % -> %, saving % -> %',
        v_sync_results.user_id,
        v_sync_results.old_creation_count,
        v_sync_results.new_creation_count,
        v_sync_results.old_saving_count,
        v_sync_results.new_saving_count;
    END IF;
  END LOOP;

  IF v_total_mismatched > 0 THEN
    RAISE NOTICE 'Synced % users with mismatched counters (out of % total users)',
      v_total_mismatched, v_total_synced;
  ELSE
    RAISE NOTICE 'All % user counters already in sync', v_total_synced;
  END IF;
END $$;

-- ============================================================================
-- 2. Add audit logging for count syncing
-- ============================================================================

COMMENT ON FUNCTION sync_blueprint_counters IS
'Syncs blueprint counter columns with actual database counts.
This function should be called after fixing the dual counting bug to reset user counts.
Created: 2025-11-05 to fix CVE-001 dual counting issue.';

COMMIT;

-- ============================================================================
-- Verification Queries (run separately to check results)
-- ============================================================================

-- Check if any users still have mismatched counters
-- SELECT
--   up.user_id,
--   up.blueprint_creation_count as stored_creation,
--   get_actual_blueprint_creation_count(up.user_id) as actual_creation,
--   up.blueprint_saving_count as stored_saving,
--   get_actual_blueprint_saving_count(up.user_id) as actual_saving,
--   (up.blueprint_creation_count = get_actual_blueprint_creation_count(up.user_id)) as creation_match,
--   (up.blueprint_saving_count = get_actual_blueprint_saving_count(up.user_id)) as saving_match
-- FROM public.user_profiles up
-- WHERE
--   up.blueprint_creation_count != get_actual_blueprint_creation_count(up.user_id)
--   OR up.blueprint_saving_count != get_actual_blueprint_saving_count(up.user_id);

-- View effective limits for all users
-- SELECT
--   up.user_id,
--   up.subscription_tier,
--   el.*
-- FROM public.user_profiles up
-- CROSS JOIN LATERAL get_effective_limits(up.user_id) el;
