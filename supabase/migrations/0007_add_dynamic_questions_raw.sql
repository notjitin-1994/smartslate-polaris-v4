-- Add dynamic_questions_raw column to blueprint_generator table
alter table public.blueprint_generator 
add column if not exists dynamic_questions_raw jsonb not null default '[]'::jsonb;

-- Add title column for display/renaming
alter table public.blueprint_generator 
add column if not exists title text null;

-- Add GIN index for the new column
create index if not exists idx_blueprint_dynamic_questions_raw 
on public.blueprint_generator using gin (dynamic_questions_raw jsonb_path_ops);

-- Update the table comment to reflect the new column
comment on column public.blueprint_generator.dynamic_questions_raw is 'Raw dynamic questions from Ollama in original format for blueprint generation';
comment on column public.blueprint_generator.dynamic_questions is 'Dynamic questions mapped to form schema for UI rendering';
comment on column public.blueprint_generator.title is 'Display title for the blueprint';

