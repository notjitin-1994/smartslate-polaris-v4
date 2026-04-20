-- Drop user_profiles and related policies
drop policy if exists "Users can delete own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can select own profile" on public.user_profiles;

alter table if exists public.user_profiles disable row level security;

drop table if exists public.user_profiles;


