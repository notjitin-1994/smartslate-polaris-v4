-- Audit Script for Broken Blueprints
-- Identifies blueprints with status='completed' but no blueprint_json
-- These were affected by the premature status change bug
-- Created: 2025-10-07
-- Purpose: Identify data that needs repair before fixing the bug

-- ==============================================================================
-- SETUP: Create helper function first
-- ==============================================================================
CREATE OR REPLACE FUNCTION jsonb_object_keys_count(j jsonb)
RETURNS int AS $$
  SELECT COUNT(*)::int FROM jsonb_object_keys(j);
$$ LANGUAGE SQL IMMUTABLE;

-- ==============================================================================
-- QUERY 1: Find blueprints with status='completed' but empty/null blueprint_json
-- ==============================================================================
SELECT 
  id,
  user_id,
  status,
  created_at,
  updated_at,
  CASE 
    WHEN blueprint_json IS NULL THEN 'NULL'
    WHEN blueprint_json = '{}'::jsonb THEN 'EMPTY OBJECT'
    WHEN blueprint_json = 'null'::jsonb THEN 'NULL VALUE'
    ELSE 'HAS DATA'
  END as blueprint_json_state,
  CASE 
    WHEN dynamic_answers IS NULL THEN 'NULL'
    WHEN dynamic_answers = '{}'::jsonb THEN 'EMPTY'
    ELSE 'HAS ANSWERS (' || jsonb_object_keys_count(dynamic_answers) || ' keys)'
  END as dynamic_answers_state,
  CASE 
    WHEN static_answers IS NULL THEN 'NULL'
    WHEN static_answers = '{}'::jsonb THEN 'EMPTY'
    ELSE 'HAS ANSWERS'
  END as static_answers_state
FROM public.blueprint_generator
WHERE status = 'completed'
  AND (
    blueprint_json = '{}'::jsonb 
    OR blueprint_json IS NULL 
    OR blueprint_json = 'null'::jsonb
  )
ORDER BY updated_at DESC;

-- ==============================================================================
-- QUERY 2: Count affected blueprints by status
-- ==============================================================================
SELECT 
  COUNT(*) as total_broken_blueprints,
  COUNT(CASE WHEN dynamic_answers != '{}'::jsonb THEN 1 END) as with_dynamic_answers,
  COUNT(CASE WHEN static_answers != '{}'::jsonb THEN 1 END) as with_static_answers,
  MIN(created_at) as oldest_broken,
  MAX(created_at) as newest_broken
FROM public.blueprint_generator
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb);

-- ==============================================================================
-- QUERY 3: Detailed view of affected blueprints (first 10)
-- ==============================================================================
SELECT 
  id,
  user_id,
  status,
  title,
  created_at,
  updated_at,
  AGE(NOW(), updated_at) as time_since_update,
  jsonb_pretty(static_answers) as static_answers_preview,
  (SELECT array_agg(key) FROM jsonb_object_keys(dynamic_answers) key) as dynamic_answer_keys,
  CASE 
    WHEN blueprint_markdown IS NULL OR blueprint_markdown = '' THEN 'NO MARKDOWN'
    ELSE 'HAS MARKDOWN (' || LENGTH(blueprint_markdown) || ' chars)'
  END as markdown_state
FROM public.blueprint_generator
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb)
ORDER BY updated_at DESC
LIMIT 10;

-- ==============================================================================
-- QUERY 4: Check if any blueprints are stuck in 'generating' status
-- ==============================================================================
SELECT 
  id,
  user_id,
  status,
  created_at,
  updated_at,
  AGE(NOW(), updated_at) as stuck_duration
FROM public.blueprint_generator
WHERE status = 'generating'
  AND updated_at < NOW() - INTERVAL '10 minutes' -- Stuck for more than 10 mins
ORDER BY updated_at DESC;

-- ==============================================================================
-- QUERY 5: Status distribution overview
-- ==============================================================================
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN blueprint_json != '{}'::jsonb AND blueprint_json IS NOT NULL THEN 1 END) as with_blueprint,
  COUNT(CASE WHEN dynamic_answers != '{}'::jsonb THEN 1 END) as with_dynamic_answers,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_to_status_seconds
FROM public.blueprint_generator
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'draft' THEN 1
    WHEN 'generating' THEN 2
    WHEN 'answering' THEN 3
    WHEN 'completed' THEN 4
    WHEN 'error' THEN 5
    ELSE 6
  END;

-- ==============================================================================
-- QUERY 6: Identify specific user impact
-- ==============================================================================
SELECT 
  user_id,
  COUNT(*) as broken_blueprints,
  array_agg(id ORDER BY updated_at DESC) as blueprint_ids,
  MAX(updated_at) as most_recent_broken
FROM public.blueprint_generator
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL)
  AND dynamic_answers != '{}'::jsonb
GROUP BY user_id
ORDER BY broken_blueprints DESC;

-- ==============================================================================
-- EXPECTED RESULTS (Before Fix)
-- ==============================================================================
-- QUERY 1: Should show blueprints with:
--   - status = 'completed'
--   - blueprint_json_state = 'EMPTY OBJECT' or 'NULL'
--   - dynamic_answers_state = 'HAS ANSWERS'
--
-- QUERY 2: Should show count > 0 if bug affected any blueprints
--
-- QUERY 3: Should show specific broken blueprints with their data
--
-- QUERY 4: May show blueprints stuck if generation crashed
--
-- QUERY 5: Should show 'completed' status with many records that don't have blueprint
--
-- QUERY 6: Should show which users are affected
--
-- ==============================================================================
-- EXPECTED RESULTS (After Fix)
-- ==============================================================================
-- All queries should show 0 broken blueprints
-- Status='completed' should ONLY exist for blueprints with valid blueprint_json
