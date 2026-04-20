-- Rollback: Remove current_section field from blueprint_generator table

ALTER TABLE public.blueprint_generator
DROP COLUMN IF EXISTS current_section;
