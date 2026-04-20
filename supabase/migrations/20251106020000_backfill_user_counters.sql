-- Migration: Backfill User Counters to Match Actual Blueprint State
-- Purpose: Update all existing users' counter values based on actual blueprint data
-- Author: System
-- Date: 2025-11-06
--
-- Context:
-- This one-time migration sets counter values to match reality:
-- - creation_count = COUNT of blueprints with dynamic_questions IS NOT NULL
-- - saving_count = COUNT of blueprints with blueprint_json IS NOT NULL
--
-- This ensures all historical data aligns with the new counter-based tracking system.

BEGIN;

-- =============================================================================
-- PHASE 1: Create Backup Table for Rollback Safety
-- =============================================================================

-- Create backup of current counter values (for rollback if needed)
CREATE TABLE IF NOT EXISTS public.user_profiles_counter_backup_20251106 (
  user_id UUID PRIMARY KEY,
  blueprint_creation_count_old INTEGER,
  blueprint_saving_count_old INTEGER,
  blueprint_creation_count_new INTEGER,
  blueprint_saving_count_new INTEGER,
  backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles_counter_backup_20251106 IS
'Backup of counter values before backfill migration. Used for verification and potential rollback.';

-- =============================================================================
-- PHASE 2: Calculate Correct Counts and Store in Backup
-- =============================================================================

INSERT INTO public.user_profiles_counter_backup_20251106 (
  user_id,
  blueprint_creation_count_old,
  blueprint_saving_count_old,
  blueprint_creation_count_new,
  blueprint_saving_count_new
)
SELECT
  up.user_id,
  -- Old counter values (before backfill)
  up.blueprint_creation_count,
  up.blueprint_saving_count,
  -- New counter values (actual counts from database)
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL  -- Exclude soft-deleted blueprints
    ),
    0
  ) as blueprint_creation_count_new,
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL  -- Exclude soft-deleted blueprints
    ),
    0
  ) as blueprint_saving_count_new
FROM user_profiles up
ON CONFLICT (user_id) DO UPDATE SET
  blueprint_creation_count_old = EXCLUDED.blueprint_creation_count_old,
  blueprint_saving_count_old = EXCLUDED.blueprint_saving_count_old,
  blueprint_creation_count_new = EXCLUDED.blueprint_creation_count_new,
  blueprint_saving_count_new = EXCLUDED.blueprint_saving_count_new,
  backed_up_at = NOW();

-- =============================================================================
-- PHASE 3: Update User Profile Counters
-- =============================================================================

-- Update all users with their correct counts
UPDATE user_profiles up
SET
  blueprint_creation_count = backup.blueprint_creation_count_new,
  blueprint_saving_count = backup.blueprint_saving_count_new,
  updated_at = NOW()
FROM user_profiles_counter_backup_20251106 backup
WHERE up.user_id = backup.user_id;

-- =============================================================================
-- PHASE 4: Log Statistics
-- =============================================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_users_with_changes INTEGER;
  v_total_creation_delta INTEGER;
  v_total_saving_delta INTEGER;
BEGIN
  -- Count total users processed
  SELECT COUNT(*) INTO v_total_users
  FROM user_profiles_counter_backup_20251106;

  -- Count users where counters changed
  SELECT COUNT(*) INTO v_users_with_changes
  FROM user_profiles_counter_backup_20251106
  WHERE blueprint_creation_count_old != blueprint_creation_count_new
     OR blueprint_saving_count_old != blueprint_saving_count_new;

  -- Calculate total delta (to verify no data loss)
  SELECT
    SUM(blueprint_creation_count_new - blueprint_creation_count_old),
    SUM(blueprint_saving_count_new - blueprint_saving_count_old)
  INTO v_total_creation_delta, v_total_saving_delta
  FROM user_profiles_counter_backup_20251106;

  -- Log results
  RAISE NOTICE 'Backfill Complete:';
  RAISE NOTICE '  Total users processed: %', v_total_users;
  RAISE NOTICE '  Users with counter changes: %', v_users_with_changes;
  RAISE NOTICE '  Creation count total delta: % (positive = increased, negative = decreased)', v_total_creation_delta;
  RAISE NOTICE '  Saving count total delta: % (positive = increased, negative = decreased)', v_total_saving_delta;
END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- View all users with counter changes
-- SELECT
--   user_id,
--   blueprint_creation_count_old AS old_creation,
--   blueprint_creation_count_new AS new_creation,
--   (blueprint_creation_count_new - blueprint_creation_count_old) AS creation_delta,
--   blueprint_saving_count_old AS old_saving,
--   blueprint_saving_count_new AS new_saving,
--   (blueprint_saving_count_new - blueprint_saving_count_old) AS saving_delta,
--   backed_up_at
-- FROM user_profiles_counter_backup_20251106
-- WHERE blueprint_creation_count_old != blueprint_creation_count_new
--    OR blueprint_saving_count_old != blueprint_saving_count_new
-- ORDER BY backed_up_at DESC;

-- View summary statistics
-- SELECT
--   COUNT(*) as total_users,
--   COUNT(*) FILTER (WHERE blueprint_creation_count_old != blueprint_creation_count_new) as creation_count_changed,
--   COUNT(*) FILTER (WHERE blueprint_saving_count_old != blueprint_saving_count_new) as saving_count_changed,
--   SUM(blueprint_creation_count_new - blueprint_creation_count_old) as total_creation_delta,
--   SUM(blueprint_saving_count_new - blueprint_saving_count_old) as total_saving_delta,
--   AVG(blueprint_creation_count_new)::NUMERIC(10,2) as avg_creation_count,
--   AVG(blueprint_saving_count_new)::NUMERIC(10,2) as avg_saving_count
-- FROM user_profiles_counter_backup_20251106;

-- Verify counters match actual data (should return 0 rows if successful)
-- SELECT
--   up.user_id,
--   up.blueprint_creation_count as counter_creation,
--   (
--     SELECT COUNT(*)
--     FROM blueprint_generator bg
--     WHERE bg.user_id = up.user_id
--       AND bg.dynamic_questions IS NOT NULL
--       AND bg.deleted_at IS NULL
--   ) as actual_creation,
--   up.blueprint_saving_count as counter_saving,
--   (
--     SELECT COUNT(*)
--     FROM blueprint_generator bg
--     WHERE bg.user_id = up.user_id
--       AND bg.blueprint_json IS NOT NULL
--       AND bg.deleted_at IS NULL
--   ) as actual_saving
-- FROM user_profiles up
-- WHERE up.blueprint_creation_count != (
--   SELECT COUNT(*)
--   FROM blueprint_generator bg
--   WHERE bg.user_id = up.user_id
--     AND bg.dynamic_questions IS NOT NULL
--     AND bg.deleted_at IS NULL
-- )
-- OR up.blueprint_saving_count != (
--   SELECT COUNT(*)
--   FROM blueprint_generator bg
--   WHERE bg.user_id = up.user_id
--     AND bg.blueprint_json IS NOT NULL
--     AND bg.deleted_at IS NULL
-- );

-- =============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- =============================================================================

-- To rollback this migration, run:
-- BEGIN;
-- UPDATE user_profiles up
-- SET
--   blueprint_creation_count = backup.blueprint_creation_count_old,
--   blueprint_saving_count = backup.blueprint_saving_count_old,
--   updated_at = NOW()
-- FROM user_profiles_counter_backup_20251106 backup
-- WHERE up.user_id = backup.user_id;
-- COMMIT;

-- After verifying rollback worked, optionally drop the backup table:
-- DROP TABLE IF EXISTS public.user_profiles_counter_backup_20251106;
