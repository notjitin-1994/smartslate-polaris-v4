-- Check for blueprints with share tokens
SELECT
  id,
  title,
  share_token,
  status,
  created_at,
  CASE
    WHEN blueprint_json IS NOT NULL THEN 'Has JSON'
    ELSE 'No JSON'
  END as has_blueprint
FROM blueprint_generator
WHERE share_token IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
