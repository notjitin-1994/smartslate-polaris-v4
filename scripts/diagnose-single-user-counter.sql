-- Find users with dynamic questionnaires generated but counter showing 0
-- This query identifies users where counter = 0 but they have generated dynamic questions

SELECT
  up.user_id,
  up.email,
  up.subscription_tier,
  up.blueprint_creation_count AS current_counter,
  up.blueprint_saving_count AS current_saving_counter,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_created,
  (
    SELECT COUNT(*)
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.blueprint_json IS NOT NULL
      AND bg.deleted_at IS NULL
  ) AS actual_saved,
  -- Show specific blueprint IDs for reference
  ARRAY(
    SELECT bg.id::text
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
    LIMIT 5
  ) AS blueprint_ids_with_questions
FROM user_profiles up
WHERE up.blueprint_creation_count = 0
  AND EXISTS (
    SELECT 1
    FROM blueprint_generator bg
    WHERE bg.user_id = up.user_id
      AND bg.dynamic_questions IS NOT NULL
      AND bg.deleted_at IS NULL
  )
ORDER BY up.created_at DESC;
