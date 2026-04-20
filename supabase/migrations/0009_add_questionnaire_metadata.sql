-- Migration: Add questionnaire metadata tracking
-- Created: 2025-01-02
-- Description: Adds version tracking and step completion for questionnaire

-- Add metadata column for questionnaire tracking
ALTER TABLE public.blueprint_generator 
ADD COLUMN IF NOT EXISTS questionnaire_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.blueprint_generator 
ADD COLUMN IF NOT EXISTS completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Index for querying by version
CREATE INDEX IF NOT EXISTS idx_questionnaire_version 
  ON public.blueprint_generator (questionnaire_version);

-- Comments
COMMENT ON COLUMN public.blueprint_generator.questionnaire_version IS 
  'Questionnaire schema version used (1=original 5 steps, 2=enhanced 8 steps)';
COMMENT ON COLUMN public.blueprint_generator.completed_steps IS 
  'Array of completed step indices for progress tracking';
