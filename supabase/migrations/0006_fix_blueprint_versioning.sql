-- Fix blueprint versioning by creating the missing RPC function
-- and ensuring only one generation per blueprint

-- Create the RPC function that was being called but didn't exist
create or replace function public.increment_blueprint_version(
  blueprint_id_input uuid,
  new_blueprint_json jsonb,
  new_blueprint_markdown text,
  new_static_answers jsonb,
  new_dynamic_answers jsonb,
  new_status text
)
returns public.blueprint_generator
language plpgsql
security definer
as $$
declare
  result public.blueprint_generator;
  current_version integer;
begin
  -- Get the current version
  select version into current_version
  from public.blueprint_generator
  where id = blueprint_id_input;
  
  -- If blueprint doesn't exist, raise error
  if current_version is null then
    raise exception 'Blueprint with id % not found', blueprint_id_input;
  end if;
  
  -- Update the existing blueprint with new data and increment version
  update public.blueprint_generator
  set
    version = current_version + 1,
    blueprint_json = new_blueprint_json,
    blueprint_markdown = new_blueprint_markdown,
    static_answers = new_static_answers,
    dynamic_answers = new_dynamic_answers,
    status = new_status,
    updated_at = now()
  where id = blueprint_id_input
  returning * into result;
  
  return result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.increment_blueprint_version(uuid, jsonb, text, jsonb, jsonb, text) to authenticated;

-- Remove the trigger that was causing automatic version increments on every update
-- This was causing multiple versions when we only want one per blueprint
drop trigger if exists trg_blueprint_version on public.blueprint_generator;

-- Create a new trigger that only increments version when status changes to 'completed'
-- This ensures we only have one completed generation per blueprint
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

-- Apply the new trigger
create trigger trg_blueprint_version_on_completion
before update on public.blueprint_generator
for each row execute function public.increment_blueprint_version_on_completion();

