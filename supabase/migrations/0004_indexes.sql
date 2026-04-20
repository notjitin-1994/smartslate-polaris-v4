-- Indexes for blueprint_generator
create index if not exists idx_blueprint_user_id on public.blueprint_generator (user_id);
create index if not exists idx_blueprint_status on public.blueprint_generator (status);
create index if not exists idx_blueprint_created_at on public.blueprint_generator (created_at);
create index if not exists idx_blueprint_user_status on public.blueprint_generator (user_id, status);

-- JSONB GIN indexes
create index if not exists idx_blueprint_static_answers on public.blueprint_generator using gin (static_answers jsonb_path_ops);
create index if not exists idx_blueprint_dynamic_questions on public.blueprint_generator using gin (dynamic_questions jsonb_path_ops);
create index if not exists idx_blueprint_dynamic_answers on public.blueprint_generator using gin (dynamic_answers jsonb_path_ops);
create index if not exists idx_blueprint_blueprint_json on public.blueprint_generator using gin (blueprint_json jsonb_path_ops);


