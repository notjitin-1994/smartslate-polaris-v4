-- Check if blueprint has all required fields for sharing
SELECT 
  id,
  title,
  share_token,
  CASE 
    WHEN blueprint_json IS NULL THEN 'Missing blueprint_json'
    WHEN blueprint_markdown IS NULL THEN 'Missing blueprint_markdown'
    WHEN share_token IS NULL THEN 'Missing share_token'
    ELSE 'OK'
  END as status,
  LENGTH(blueprint_markdown::text) as markdown_length,
  created_at
FROM blueprint_generator 
WHERE id = '45f02964-a1fc-43fa-9a21-f29cf1a8ae65';
