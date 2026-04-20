-- Verify Counter Backfill Success
-- Run this AFTER applying migration 20251106020000_backfill_user_counters.sql
-- to verify all counters match actual blueprint states

\echo '\n==================================================================='
\echo 'COUNTER BACKFILL VERIFICATION'
\echo '==================================================================='
\echo 'Checking if all user counters match actual blueprint data...\n'

-- Check if backup table exists
\echo '\n--- BACKUP TABLE STATUS ---\n'

SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles_counter_backup_20251106'
  ) AS "Backup Table Exists";

-- Show backup summary
\echo '\n--- BACKFILL SUMMARY (from backup table) ---\n'

SELECT
  COUNT(*) AS "Total Users Processed",
  COUNT(*) FILTER (
    WHERE blueprint_creation_count_old != blueprint_creation_count_new
  ) AS "Creation Count Changed",
  COUNT(*) FILTER (
    WHERE blueprint_saving_count_old != blueprint_saving_count_new
  ) AS "Saving Count Changed",
  SUM(blueprint_creation_count_new - blueprint_creation_count_old) AS "Total Creation Delta",
  SUM(blueprint_saving_count_new - blueprint_saving_count_old) AS "Total Saving Delta",
  MAX(backed_up_at) AS "Backfill Timestamp"
FROM user_profiles_counter_backup_20251106;

-- Verify counters match reality (SHOULD RETURN 0 ROWS)
\echo '\n--- COUNTER ACCURACY CHECK ---\n'
\echo 'The following query should return 0 rows if backfill was successful:\n'

SELECT
  up.user_id,
  up.blueprint_creation_count AS "Counter Creation",
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS "Actual Creation",
  (
    up.blueprint_creation_count - (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    )
  ) AS "Creation Diff",
  up.blueprint_saving_count AS "Counter Saving",
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS "Actual Saving",
  (
    up.blueprint_saving_count - (
      SELECT COUNT(*)
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    )
  ) AS "Saving Diff"
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

-- Count mismatches
\echo '\n--- MISMATCH COUNT ---\n'

SELECT
  COUNT(*) AS "Users with Mismatched Counters"
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

-- Show sample of corrected users
\echo '\n--- SAMPLE OF USERS WITH LARGEST CORRECTIONS ---\n'

SELECT
  user_id,
  blueprint_creation_count_old AS "Old Creation",
  blueprint_creation_count_new AS "New Creation",
  (blueprint_creation_count_new - blueprint_creation_count_old) AS "Creation Δ",
  blueprint_saving_count_old AS "Old Saving",
  blueprint_saving_count_new AS "New Saving",
  (blueprint_saving_count_new - blueprint_saving_count_old) AS "Saving Δ"
FROM user_profiles_counter_backup_20251106
WHERE blueprint_creation_count_old != blueprint_creation_count_new
   OR blueprint_saving_count_old != blueprint_saving_count_new
ORDER BY ABS(blueprint_creation_count_new - blueprint_creation_count_old) DESC
LIMIT 10;

-- Distribution of changes
\echo '\n--- CHANGE DISTRIBUTION ---\n'

WITH changes AS (
  SELECT
    CASE
      WHEN blueprint_creation_count_new > blueprint_creation_count_old THEN 'Increased'
      WHEN blueprint_creation_count_new < blueprint_creation_count_old THEN 'Decreased'
      ELSE 'No Change'
    END AS creation_change_type,
    CASE
      WHEN blueprint_saving_count_new > blueprint_saving_count_old THEN 'Increased'
      WHEN blueprint_saving_count_new < blueprint_saving_count_old THEN 'Decreased'
      ELSE 'No Change'
    END AS saving_change_type
  FROM user_profiles_counter_backup_20251106
)
SELECT
  creation_change_type AS "Creation Change Type",
  COUNT(*) AS "User Count",
  ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM user_profiles_counter_backup_20251106), 0), 1) AS "% of Total"
FROM changes
GROUP BY creation_change_type
ORDER BY "User Count" DESC;

\echo '\n==================================================================='
\echo 'SUCCESS CRITERIA:'
\echo '  ✅ Backup table exists'
\echo '  ✅ "Users with Mismatched Counters" = 0'
\echo '  ✅ "COUNTER ACCURACY CHECK" returns 0 rows'
\echo '==================================================================='
\echo '\nIf all checks pass, the backfill was successful!'
\echo 'You can now safely drop the backup table (see docs for instructions).\n'
