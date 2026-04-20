-- Rollback blueprint versioning fix

-- Drop the new trigger
drop trigger if exists trg_blueprint_version_on_completion on public.blueprint_generator;

-- Drop the new function
drop function if exists public.increment_blueprint_version_on_completion();

-- Drop the RPC function
drop function if exists public.increment_blueprint_version(uuid, jsonb, text, jsonb, jsonb, text);

-- Restore the original trigger (if needed)
-- Note: This would restore the old behavior that caused multiple versions
-- Uncomment only if you want to revert to the old behavior
-- create trigger trg_blueprint_version
-- before update on public.blueprint_generator
-- for each row execute function public.increment_blueprint_version();

