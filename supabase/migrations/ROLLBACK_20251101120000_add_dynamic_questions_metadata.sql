-- Rollback: Remove dynamic_questions_metadata and dynamic_questions_raw columns
ALTER TABLE public.blueprint_generator
DROP COLUMN IF EXISTS dynamic_questions_metadata;

ALTER TABLE public.blueprint_generator
DROP COLUMN IF EXISTS dynamic_questions_raw;
