-- Rollback: Enhance static_answers schema
-- Removes indexes, functions, and triggers added in migration 0008

DROP FUNCTION IF EXISTS migrate_static_answers_v1_to_v2(jsonb);
DROP TRIGGER IF EXISTS trigger_validate_static_answers ON public.blueprint_generator;
DROP FUNCTION IF EXISTS validate_static_answers();
DROP INDEX IF EXISTS idx_static_answers_blooms_level;
DROP INDEX IF EXISTS idx_static_answers_modality;
DROP INDEX IF EXISTS idx_static_answers_role;
DROP INDEX IF EXISTS idx_static_answers_version;
