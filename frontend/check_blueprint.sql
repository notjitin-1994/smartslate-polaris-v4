-- Check for test blueprints with status 'draft' or 'error'
SELECT
  id,
  user_id,
  status,
  CASE
    WHEN static_answers IS NOT NULL AND static_answers::text != '{}' THEN 'Yes'
    ELSE 'No'
  END AS has_static_answers,
  CASE
    WHEN dynamic_questions IS NOT NULL AND dynamic_questions::text != '[]' THEN 'Yes'
    ELSE 'No'
  END AS has_dynamic_questions,
  CASE
    WHEN dynamic_answers IS NOT NULL AND dynamic_answers::text != '{}' THEN 'Yes'
    ELSE 'No'
  END AS has_dynamic_answers,
  created_at,
  updated_at
FROM blueprint_generator
WHERE status IN ('draft', 'error')
ORDER BY updated_at DESC
LIMIT 10;