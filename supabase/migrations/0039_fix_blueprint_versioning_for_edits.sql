-- Fix blueprint versioning to increment on manual and AI edits
-- This migration ensures:
-- 1. Initial generation: version = 1
-- 2. Manual edits (Edit Section): version increments
-- 3. AI edits (Edit with AI): version increments
-- 4. Auto-saves and questionnaire updates: NO increment

-- First, drop any existing versioning triggers to start fresh
drop trigger if exists trg_blueprint_version on public.blueprint_generator;
drop trigger if exists trg_blueprint_version_on_completion on public.blueprint_generator;

-- Drop old trigger function that was causing issues
drop function if exists public.increment_blueprint_version();

-- Create new intelligent versioning function
create or replace function public.increment_blueprint_version_on_blueprint_edit()
returns trigger as $$
begin
  -- Only increment version when:
  -- 1. Blueprint is in 'completed' status (not draft/generating/error)
  -- 2. The blueprint_json field has actually changed
  -- This ensures version increments for manual and AI edits, but not for:
  -- - Initial generation (status changes from generating → completed, but version starts at 1)
  -- - Auto-saves of questionnaires (blueprint_json is null or unchanged)
  -- - Status-only updates

  if new.status = 'completed' and
     old.status = 'completed' and
     new.blueprint_json is not null and
     old.blueprint_json is not null and
     new.blueprint_json is distinct from old.blueprint_json then
    -- This is an edit of a completed blueprint
    new.version := coalesce(old.version, 1) + 1;
  elsif new.status = 'completed' and
        (old.status is null or old.status != 'completed') and
        new.blueprint_json is not null then
    -- This is initial completion - ensure version is 1
    new.version := 1;
  end if;

  return new;
end;
$$ language plpgsql;

-- Apply the new trigger
create trigger trg_blueprint_version_on_blueprint_edit
before update on public.blueprint_generator
for each row execute function public.increment_blueprint_version_on_blueprint_edit();

-- Ensure the RPC function exists for explicit version increments (if needed)
-- This is already created in migration 0006, but we ensure it's compatible
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

-- Comment explaining the versioning logic
comment on function public.increment_blueprint_version_on_blueprint_edit() is
'Intelligently increments blueprint version when blueprint_json is edited on a completed blueprint. Initial generation sets version to 1. Subsequent edits increment version.';
