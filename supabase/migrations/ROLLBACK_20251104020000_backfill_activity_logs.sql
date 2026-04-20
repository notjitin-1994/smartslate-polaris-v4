-- Rollback Migration: Backfill Activity Logs for Existing Users
-- Description: Removes backfilled activity log entries and helper functions
-- Author: SmartSlate Team
-- Date: 2025-11-04

-- ============================================================================
-- DROP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_users_without_activity_logs();
DROP FUNCTION IF EXISTS get_blueprints_without_activity_logs();
DROP FUNCTION IF EXISTS backfill_user_created_logs();
DROP FUNCTION IF EXISTS backfill_user_updated_logs();
DROP FUNCTION IF EXISTS backfill_blueprint_created_logs();

-- ============================================================================
-- REMOVE BACKFILLED ACTIVITY LOGS
-- ============================================================================

-- Log what we're about to delete
DO $$
DECLARE
  v_total_count INT;
BEGIN
  SELECT COUNT(*) INTO v_total_count
  FROM activity_logs
  WHERE metadata->>'backfilled' = 'true'
    AND metadata->>'source' = 'migration_20251104020000';

  RAISE NOTICE 'Rolling back backfilled activity logs: % entries', v_total_count;
END $$;

-- Delete all backfilled logs created by migration 20251104020000
DELETE FROM activity_logs
WHERE metadata->>'backfilled' = 'true'
  AND metadata->>'source' = 'migration_20251104020000';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify deletion
DO $$
DECLARE
  v_remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO v_remaining_count
  FROM activity_logs
  WHERE metadata->>'backfilled' = 'true'
    AND metadata->>'source' = 'migration_20251104020000';

  IF v_remaining_count > 0 THEN
    RAISE WARNING 'Rollback incomplete: % backfilled entries remain', v_remaining_count;
  ELSE
    RAISE NOTICE 'Rollback completed successfully: All backfilled entries removed';
  END IF;
END $$;
