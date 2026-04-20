-- Data Repair Script for Broken Blueprints
-- Resets status of blueprints affected by premature status change bug
-- Created: 2025-10-07
-- Purpose: Allow users to regenerate their blueprints

-- ==============================================================================
-- IMPORTANT: Run audit-broken-blueprints.sql FIRST to review affected data
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Backup affected blueprints before repair
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blueprint_generator_backup_20251007 AS
SELECT * FROM public.blueprint_generator
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb)
  AND dynamic_answers IS NOT NULL
  AND dynamic_answers != '{}'::jsonb;

-- Verify backup
SELECT COUNT(*) as backed_up_count FROM public.blueprint_generator_backup_20251007;

-- ==============================================================================
-- STEP 2: Reset broken blueprints to allow regeneration
-- ==============================================================================
BEGIN;

-- Update broken blueprints to 'answering' status
-- This allows them to be regenerated via /api/blueprints/generate
UPDATE public.blueprint_generator
SET 
  status = 'answering',
  updated_at = NOW()
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb)
  AND dynamic_answers IS NOT NULL
  AND dynamic_answers != '{}'::jsonb;

-- Get count of repaired blueprints
-- This should match the backup count
SELECT COUNT(*) as repaired_count 
FROM public.blueprint_generator
WHERE status = 'answering'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb)
  AND dynamic_answers IS NOT NULL
  AND dynamic_answers != '{}'::jsonb;

-- Only commit if you're satisfied with the changes
-- Otherwise run: ROLLBACK;
COMMIT;

-- ==============================================================================
-- STEP 3: Verify repair was successful
-- ==============================================================================

-- Should return 0 rows (no more broken blueprints with status='completed')
SELECT COUNT(*) as remaining_broken
FROM public.blueprint_generator
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb)
  AND dynamic_answers != '{}'::jsonb;

-- Should return the repaired blueprints (now with status='answering')
SELECT 
  id,
  user_id,
  status,
  updated_at,
  'Ready for regeneration' as repair_status
FROM public.blueprint_generator
WHERE id IN (SELECT id FROM public.blueprint_generator_backup_20251007)
ORDER BY updated_at DESC;

-- ==============================================================================
-- STEP 4: Generate list of affected users for notification
-- ==============================================================================
SELECT DISTINCT
  user_id,
  COUNT(*) as blueprints_affected,
  array_agg(id ORDER BY updated_at DESC) as blueprint_ids
FROM public.blueprint_generator_backup_20251007
GROUP BY user_id
ORDER BY blueprints_affected DESC;

-- ==============================================================================
-- ROLLBACK PROCEDURE (If something goes wrong)
-- ==============================================================================
-- To rollback the repair:
--
-- BEGIN;
-- 
-- -- Restore from backup
-- UPDATE public.blueprint_generator bg
-- SET 
--   status = backup.status,
--   updated_at = backup.updated_at
-- FROM public.blueprint_generator_backup_20251007 backup
-- WHERE bg.id = backup.id;
--
-- COMMIT;
--
-- -- Verify rollback
-- SELECT COUNT(*) FROM public.blueprint_generator
-- WHERE status = 'completed'
--   AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL);
-- ==============================================================================

-- ==============================================================================
-- CLEANUP (Run after successful repair and verification)
-- ==============================================================================
-- After confirming repair worked and users can regenerate:
-- DROP TABLE IF EXISTS public.blueprint_generator_backup_20251007;
-- ==============================================================================
