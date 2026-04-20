-- Pre-migration cleanup for 0041_advanced_share_system.sql
-- Drop the policy that depends on share_token column before the main migration

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Public can view shared blueprints" ON public.blueprint_generator;

-- Drop the column now that the policy is gone
ALTER TABLE public.blueprint_generator DROP COLUMN IF EXISTS share_token;
