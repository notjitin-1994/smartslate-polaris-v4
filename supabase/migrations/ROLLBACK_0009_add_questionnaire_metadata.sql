-- Rollback: Add questionnaire metadata
-- Removes columns added in migration 0009

DROP INDEX IF EXISTS idx_questionnaire_version;
ALTER TABLE public.blueprint_generator DROP COLUMN IF EXISTS questionnaire_version;
ALTER TABLE public.blueprint_generator DROP COLUMN IF EXISTS completed_steps;
