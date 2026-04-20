-- Simple Counter Verification (no psql commands, can run in Supabase SQL Editor)

-- 1. Check if backup table exists and show summary
SELECT
  COUNT(*) AS total_users_backed_up,
  COUNT(*) FILTER (WHERE blueprint_creation_count_old != blueprint_creation_count_new) AS creation_changed,
  COUNT(*) FILTER (WHERE blueprint_saving_count_old != blueprint_saving_count_new) AS saving_changed,
  SUM(blueprint_creation_count_new - blueprint_creation_count_old) AS total_creation_delta,
  SUM(blueprint_saving_count_new - blueprint_saving_count_old) AS total_saving_delta
FROM user_profiles_counter_backup_20251106;

-- 2. Check for users with MISMATCHED counters (should be 0 if successful)
SELECT COUNT(*) AS users_with_mismatched_counters
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

-- 3. Show any users with mismatches (for debugging)
SELECT
  up.user_id,
  up.blueprint_creation_count AS counter_creation,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_creation,
  up.blueprint_saving_count AS counter_saving,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_saving
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
)
LIMIT 10;
