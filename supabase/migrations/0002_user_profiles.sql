-- user_profiles table: 1-1 extension of auth.users
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text null,
  avatar_url text null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.user_profiles enable row level security;

-- Policies
create policy "Users can select own profile"
on public.user_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (user_id = auth.uid());

create policy "Users can delete own profile"
on public.user_profiles
for delete
to authenticated
using (user_id = auth.uid());


