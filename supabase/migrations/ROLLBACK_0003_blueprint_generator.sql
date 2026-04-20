-- Drop blueprint_generator and related policies
drop policy if exists "Users can delete own blueprints" on public.blueprint_generator;
drop policy if exists "Users can update own blueprints" on public.blueprint_generator;
drop policy if exists "Users can insert own blueprints" on public.blueprint_generator;
drop policy if exists "Users can select own blueprints" on public.blueprint_generator;

alter table if exists public.blueprint_generator disable row level security;

drop table if exists public.blueprint_generator;


