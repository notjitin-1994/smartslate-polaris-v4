-- blueprint_generator table
create table if not exists public.blueprint_generator (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  static_answers jsonb not null default '{}'::jsonb,
  dynamic_questions jsonb not null default '[]'::jsonb,
  dynamic_answers jsonb not null default '{}'::jsonb,
  blueprint_json jsonb not null default '{}'::jsonb,
  blueprint_markdown text null,
  status text not null default 'draft' check (status in ('draft','generating','completed','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.blueprint_generator enable row level security;

-- Policies
create policy "Users can select own blueprints"
on public.blueprint_generator
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own blueprints"
on public.blueprint_generator
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own blueprints"
on public.blueprint_generator
for update
to authenticated
using (user_id = auth.uid());

create policy "Users can delete own blueprints"
on public.blueprint_generator
for delete
to authenticated
using (user_id = auth.uid());


