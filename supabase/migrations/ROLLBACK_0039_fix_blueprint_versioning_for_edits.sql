-- Rollback migration for 0039_fix_blueprint_versioning_for_edits.sql
-- This restores the previous versioning behavior

-- Drop the new trigger
drop trigger if exists trg_blueprint_version_on_blueprint_edit on public.blueprint_generator;

-- Drop the new trigger function
drop function if exists public.increment_blueprint_version_on_blueprint_edit();

-- Restore the previous trigger from migration 0006
create or replace function public.increment_blueprint_version_on_completion()
returns trigger as $$
begin
  -- Only increment version when status changes to 'completed'
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    new.version := coalesce(old.version, 1) + 1;
  end if;
  return new;
end;
$$ language plpgsql;

-- Apply the previous trigger
create trigger trg_blueprint_version_on_completion
before update on public.blueprint_generator
for each row execute function public.increment_blueprint_version_on_completion();
