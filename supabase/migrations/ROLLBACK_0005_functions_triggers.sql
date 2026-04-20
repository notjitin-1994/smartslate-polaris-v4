-- Rollback functions and triggers
drop trigger if exists trg_blueprint_version on public.blueprint_generator;
drop trigger if exists trg_blueprint_updated_at on public.blueprint_generator;
drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;

drop function if exists public.increment_blueprint_version();
drop function if exists public.set_updated_at();


