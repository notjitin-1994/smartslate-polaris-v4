SELECT 
  id, 
  created_at, 
  updated_at,
  status,
  blueprint_json::text as blueprint_data,
  blueprint_markdown
FROM blueprint_generator 
WHERE id = 'a141d047-c31f-426a-807b-a26b44ef9c15';
