-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- versioning trigger function
create or replace function public.increment_blueprint_version()
returns trigger as $$
begin
  new.version := coalesce(old.version, 1) + 1;
  return new;
end;
$$ language plpgsql;

-- Triggers for user_profiles
drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- Triggers for blueprint_generator
drop trigger if exists trg_blueprint_updated_at on public.blueprint_generator;
create trigger trg_blueprint_updated_at
before update on public.blueprint_generator
for each row execute function public.set_updated_at();

drop trigger if exists trg_blueprint_version on public.blueprint_generator;
create trigger trg_blueprint_version
before update on public.blueprint_generator
for each row execute function public.increment_blueprint_version();


