-- Add dynamic_questions_metadata column to track retry attempts and generation metadata
ALTER TABLE public.blueprint_generator
ADD COLUMN IF NOT EXISTS dynamic_questions_metadata jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.blueprint_generator.dynamic_questions_metadata IS
'Metadata for dynamic question generation including retry attempts, timestamps, and error tracking';

-- Add dynamic_questions_raw column to store unprocessed LLM output for debugging
ALTER TABLE public.blueprint_generator
ADD COLUMN IF NOT EXISTS dynamic_questions_raw jsonb DEFAULT NULL;

COMMENT ON COLUMN public.blueprint_generator.dynamic_questions_raw IS
'Raw unprocessed output from LLM before normalization, used for debugging and error recovery';
