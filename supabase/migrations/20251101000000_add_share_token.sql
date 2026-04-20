-- Add share_token column to blueprint_generator table for public sharing
-- This enables users to create shareable public links to their blueprint analytics

-- Add share_token column (nullable, unique)
alter table public.blueprint_generator
  add column if not exists share_token text unique;

-- Add index for fast lookups by share_token (skip if exists)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'blueprint_generator'
    and indexname = 'idx_blueprint_share_token'
  ) then
    create index idx_blueprint_share_token
      on public.blueprint_generator(share_token);
  end if;
end $$;

-- Add function to generate random share tokens (skip if exists)
create or replace function public.generate_share_token()
returns text
language plpgsql
as $$
declare
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  token text := '';
  i integer;
begin
  -- Generate 32-character random token
  for i in 1..32 loop
    token := token || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  end loop;
  return token;
end;
$$;

-- Create RLS policy for public access to shared blueprints (read-only)
-- This allows unauthenticated users to view blueprints with a valid share_token
-- Skip if policy already exists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'blueprint_generator'
    and policyname = 'Public can view shared blueprints'
  ) then
    create policy "Public can view shared blueprints"
    on public.blueprint_generator
    for select
    to anon
    using (share_token is not null);
  end if;
end $$;

-- Note: Existing authenticated user policies remain unchanged
-- Users can still only modify their own blueprints

