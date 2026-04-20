-- Add 'answering' status to blueprint_generator table
-- This aligns the database with PRD specification (prd.txt:272-273)
-- Created: 2025-10-07
-- Priority: P0 Critical - Fixes blueprint generation malfunction

-- Drop existing constraint
ALTER TABLE public.blueprint_generator 
DROP CONSTRAINT IF EXISTS blueprint_generator_status_check;

-- Add new constraint with 'answering' status
ALTER TABLE public.blueprint_generator 
ADD CONSTRAINT blueprint_generator_status_check 
CHECK (status IN ('draft', 'generating', 'answering', 'completed', 'error'));

-- Add helpful comment explaining status flow
COMMENT ON CONSTRAINT blueprint_generator_status_check ON public.blueprint_generator 
IS 'Status values per PRD: draft=initial, generating=LLM creating questions, answering=user filling questionnaire, completed=blueprint generated, error=failure';

-- Update any existing blueprints that might be in an inconsistent state
-- Blueprints with dynamic_answers but no blueprint_json should be 'answering', not 'completed'
UPDATE public.blueprint_generator
SET status = 'answering',
    updated_at = NOW()
WHERE status = 'completed'
  AND (blueprint_json = '{}'::jsonb OR blueprint_json IS NULL OR blueprint_json = 'null'::jsonb)
  AND dynamic_answers IS NOT NULL
  AND dynamic_answers != '{}'::jsonb;
