-- Add first_name and last_name fields to user_profiles table
alter table public.user_profiles 
add column if not exists first_name text,
add column if not exists last_name text;

-- Update existing records to split full_name into first_name and last_name where possible
update public.user_profiles
set 
  first_name = split_part(full_name, ' ', 1),
  last_name = case 
    when array_length(string_to_array(full_name, ' '), 1) > 1 
    then array_to_string((string_to_array(full_name, ' '))[2:], ' ')
    else ''
  end
where full_name is not null and full_name != '';

-- Create indexes for better query performance
create index if not exists idx_user_profiles_first_name on public.user_profiles(first_name);
create index if not exists idx_user_profiles_last_name on public.user_profiles(last_name);

-- Update the full_name field to be computed from first_name and last_name
-- First, let's add a trigger to automatically update full_name when first_name or last_name changes
create or replace function public.update_full_name()
returns trigger as $$
begin
  new.full_name = trim(concat(coalesce(new.first_name, ''), ' ', coalesce(new.last_name, '')));
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists and create new one
drop trigger if exists trigger_update_full_name on public.user_profiles;
create trigger trigger_update_full_name
  before insert or update on public.user_profiles
  for each row execute function public.update_full_name();
