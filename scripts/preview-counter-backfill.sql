-- Preview Counter Backfill Changes
-- Run this BEFORE applying migration 20251106020000_backfill_user_counters.sql
-- to see what changes will be made

\echo '\n==================================================================='
\echo 'COUNTER BACKFILL PREVIEW'
\echo '==================================================================='
\echo 'This shows what will change when you run the backfill migration.\n'

-- Summary Statistics
\echo '\n--- SUMMARY STATISTICS ---\n'

WITH changes AS (
  SELECT
    up.user_id,
    up.blueprint_creation_count AS old_creation,
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM blueprint_generator bg
        WHERE bg.user_id = up.user_id
          AND bg.dynamic_questions IS NOT NULL
          AND bg.deleted_at IS NULL
      ),
      0
    ) AS new_creation,
    up.blueprint_saving_count AS old_saving,
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM blueprint_generator bg
        WHERE bg.user_id = up.user_id
          AND bg.blueprint_json IS NOT NULL
          AND bg.deleted_at IS NULL
      ),
      0
    ) AS new_saving
  FROM user_profiles up
)
SELECT
  COUNT(*) AS "Total Users",
  COUNT(*) FILTER (WHERE old_creation != new_creation) AS "Creation Count Changes",
  COUNT(*) FILTER (WHERE old_saving != new_saving) AS "Saving Count Changes",
  SUM(new_creation - old_creation) AS "Total Creation Delta",
  SUM(new_saving - old_saving) AS "Total Saving Delta",
  ROUND(AVG(old_creation), 2) AS "Avg Current Creation",
  ROUND(AVG(new_creation), 2) AS "Avg New Creation",
  ROUND(AVG(old_saving), 2) AS "Avg Current Saving",
  ROUND(AVG(new_saving), 2) AS "Avg New Saving"
FROM changes;

\echo '\n--- USERS WITH COUNTER CHANGES (Top 20) ---\n'

SELECT
  up.user_id,
  up.blueprint_creation_count AS "Current Creation",
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) AS "New Creation",
  (
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM blueprint_generator bg
        WHERE bg.user_id = up.user_id
          AND bg.dynamic_questions IS NOT NULL
          AND bg.deleted_at IS NULL
      ),
      0
    ) - up.blueprint_creation_count
  ) AS "Creation Δ",
  up.blueprint_saving_count AS "Current Saving",
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) AS "New Saving",
  (
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM blueprint_generator bg
        WHERE bg.user_id = up.user_id
          AND bg.blueprint_json IS NOT NULL
          AND bg.deleted_at IS NULL
      ),
      0
    ) - up.blueprint_saving_count
  ) AS "Saving Δ",
  up.subscription_tier AS "Tier"
FROM user_profiles up
WHERE up.blueprint_creation_count != COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  )
  OR up.blueprint_saving_count != COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.blueprint_json IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  )
ORDER BY ABS(
  COALESCE(
    (
      SELECT COUNT(*)::INTEGER
      FROM blueprint_generator bg
      WHERE bg.user_id = up.user_id
        AND bg.dynamic_questions IS NOT NULL
        AND bg.deleted_at IS NULL
    ),
    0
  ) - up.blueprint_creation_count
) DESC
LIMIT 20;

\echo '\n--- DELTA DISTRIBUTION ---\n'

WITH deltas AS (
  SELECT
    (
      COALESCE(
        (
          SELECT COUNT(*)::INTEGER
          FROM blueprint_generator bg
          WHERE bg.user_id = up.user_id
            AND bg.dynamic_questions IS NOT NULL
            AND bg.deleted_at IS NULL
        ),
        0
      ) - up.blueprint_creation_count
    ) AS creation_delta,
    (
      COALESCE(
        (
          SELECT COUNT(*)::INTEGER
          FROM blueprint_generator bg
          WHERE bg.user_id = up.user_id
            AND bg.blueprint_json IS NOT NULL
            AND bg.deleted_at IS NULL
        ),
        0
      ) - up.blueprint_saving_count
    ) AS saving_delta
  FROM user_profiles up
)
SELECT
  creation_delta AS "Creation Delta",
  COUNT(*) FILTER (WHERE creation_delta = creation_delta) AS "Users with This Delta",
  ROUND(100.0 * COUNT(*) FILTER (WHERE creation_delta = creation_delta) / NULLIF((SELECT COUNT(*) FROM user_profiles), 0), 1) AS "% of Users"
FROM deltas
GROUP BY creation_delta
ORDER BY "Users with This Delta" DESC
LIMIT 10;

\echo '\n==================================================================='
\echo 'Interpretation:'
\echo '  - Negative delta = Counter will DECREASE (double-counting fix)'
\echo '  - Positive delta = Counter will INCREASE (missed increments)'
\echo '  - Zero delta = No change needed'
\echo '==================================================================='
\echo '\nTo apply the backfill, run: npm run db:push'
\echo 'For more details, see: docs/COUNTER_BACKFILL_GUIDE.md\n'
