-- Rollback: Remove dynamic_questions_raw column from blueprint_generator table
drop index if exists idx_blueprint_dynamic_questions_raw;
alter table public.blueprint_generator drop column if exists dynamic_questions_raw;

