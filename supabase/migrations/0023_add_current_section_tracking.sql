-- Add current_section field to blueprint_generator table
-- This tracks which section the user was last viewing in the dynamic questionnaire

ALTER TABLE public.blueprint_generator
ADD COLUMN IF NOT EXISTS current_section integer DEFAULT 0;

COMMENT ON COLUMN public.blueprint_generator.current_section IS 'Tracks the current section index (0-based) the user is on in the dynamic questionnaire';
