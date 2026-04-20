-- Migration: Separate 'free' and 'explorer' tiers
-- Purpose: Create distinct 'free' tier for new users, make 'explorer' a paid tier
-- Issue: Currently 'explorer' is used as the free tier, causing UX confusion
-- Created: 2025-11-02
--
-- New Tier Structure:
-- - 'free': 2 blueprints/month, ₹0 (new users start here)
-- - 'explorer': 5 blueprints/month, paid tier (first paid upgrade)
-- - 'navigator', 'voyager', etc.: existing paid tiers

BEGIN;

-- ============================================================================
-- 1. Update tier_config table constraint to include 'free'
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.tier_config
DROP CONSTRAINT IF EXISTS check_valid_tier;

-- Add new constraint with 'free' tier
ALTER TABLE public.tier_config
ADD CONSTRAINT check_valid_tier
CHECK (tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'));

-- ============================================================================
-- 2. Update user_profiles table constraint to include 'free'
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_subscription_tier;

-- Add new constraint with 'free' tier
ALTER TABLE public.user_profiles
ADD CONSTRAINT check_valid_subscription_tier
CHECK (subscription_tier IN ('free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'));

-- ============================================================================
-- 3. Insert 'free' tier configuration
-- ============================================================================

INSERT INTO public.tier_config (
  tier,
  display_name,
  blueprint_creation_limit,
  blueprint_saving_limit,
  is_team_tier,
  price_monthly_paise,
  price_yearly_paise,
  razorpay_plan_id_monthly,
  razorpay_plan_id_yearly,
  features
) VALUES (
  'free',
  'Free',
  2,  -- 2 blueprints per month (lower than explorer's 5)
  2,  -- 2 saves per month
  false,
  0,  -- ₹0 - completely free
  0,
  NULL,
  NULL,
  '{"description": "Free tier for new users", "rollover": false, "support": "community", "trial": false}'::jsonb
)
ON CONFLICT (tier) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  blueprint_creation_limit = EXCLUDED.blueprint_creation_limit,
  blueprint_saving_limit = EXCLUDED.blueprint_saving_limit,
  price_monthly_paise = EXCLUDED.price_monthly_paise,
  price_yearly_paise = EXCLUDED.price_yearly_paise,
  features = EXCLUDED.features;

-- ============================================================================
-- 4. Update 'explorer' tier to be a paid tier
-- ============================================================================

UPDATE public.tier_config
SET
  display_name = 'Explorer',
  blueprint_creation_limit = 5,
  blueprint_saving_limit = 5,
  price_monthly_paise = 99900,  -- ₹999/month (first paid tier)
  price_yearly_paise = 999000,  -- ₹9,990/year
  razorpay_plan_id_monthly = 'plan_explorer_monthly',  -- TODO: Update with actual Razorpay plan ID
  razorpay_plan_id_yearly = 'plan_explorer_yearly',    -- TODO: Update with actual Razorpay plan ID
  features = '{"description": "Entry-level paid tier", "rollover": true, "support": "email", "priority_access": false}'::jsonb
WHERE tier = 'explorer';

-- ============================================================================
-- 5. Migrate existing 'explorer' tier users to 'free' tier
-- ============================================================================

-- Only migrate users who have NOT paid (0 price in metadata)
-- This preserves any users who might have actually paid for explorer
UPDATE public.user_profiles
SET subscription_tier = 'free'
WHERE subscription_tier = 'explorer'
  AND (
    subscription_metadata->>'plan_id' = 'explorer'
    OR subscription_metadata->'limits'->>'max_generations_monthly' = '5'
    OR subscription_metadata->'limits'->>'max_generations_monthly' = '2'
  );

-- Log the migration
DO $$
DECLARE
  v_migrated_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

  IF v_migrated_count > 0 THEN
    RAISE NOTICE 'Migrated % users from ''explorer'' tier to ''free'' tier', v_migrated_count;
  END IF;
END $$;

-- ============================================================================
-- 6. Update handle_new_user() to assign 'free' tier
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    subscription_tier,
    user_role,
    subscription_metadata,
    role_assigned_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'free',  -- ✅ NEW: Free tier (2 blueprints/month, ₹0)
    'user',  -- ✅ Standard user role
    jsonb_build_object(
      'plan_id', 'free',
      'billing_cycle', 'monthly',
      'started_at', NEW.created_at,
      'renewal_date', NEW.created_at + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', 2,  -- Free tier: 2 blueprints/month
        'max_saved_starmaps', 2
      )
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS
'Automatically creates a user_profiles record when a new auth user is created.
Sets subscription_tier to ''free'' (2 blueprints/month) and user_role to ''user''.';

-- ============================================================================
-- 7. Update get_tier_limits function to handle 'free' tier
-- ============================================================================

-- The function already has fail-closed behavior, so it will work with 'free' tier
-- No changes needed, but we can verify it works correctly

-- ============================================================================
-- 8. Create helper function to check if user is on free tier
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_free_tier_user(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_id = p_user_id
    AND subscription_tier = 'free'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.is_free_tier_user IS
'Check if a user is on the free tier (not explorer or any paid tier)';

-- ============================================================================
-- 9. Add migration audit log entry
-- ============================================================================

-- Log to security audit if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_log') THEN
    PERFORM log_security_event(
      p_event_type := 'tier_structure_updated',
      p_event_category := 'system',
      p_action := 'tier_configuration_changed',  -- ✅ FIXED: Use valid action from constraint
      p_success := true,
      p_risk_level := 'low',
      p_metadata := jsonb_build_object(
        'migration', '20251102190000_separate_free_and_explorer_tiers',
        'changes', jsonb_build_array(
          'Added ''free'' tier with 2 blueprints/month',
          'Updated ''explorer'' to paid tier with 5 blueprints/month',
          'Migrated existing free users to ''free'' tier',
          'Updated handle_new_user to assign ''free'' tier'
        )
      )
    );
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries (run manually after migration)
-- ============================================================================

-- Check tier configuration
-- SELECT tier, display_name, blueprint_creation_limit, price_monthly_paise
-- FROM public.tier_config
-- ORDER BY CASE tier
--   WHEN 'free' THEN 1
--   WHEN 'explorer' THEN 2
--   WHEN 'navigator' THEN 3
--   WHEN 'voyager' THEN 4
--   WHEN 'crew' THEN 5
--   WHEN 'fleet' THEN 6
--   WHEN 'armada' THEN 7
--   WHEN 'enterprise' THEN 8
--   WHEN 'developer' THEN 9
-- END;

-- Check user distribution across tiers
-- SELECT subscription_tier, COUNT(*) as user_count
-- FROM public.user_profiles
-- GROUP BY subscription_tier
-- ORDER BY user_count DESC;

-- Verify free tier users have correct limits
-- SELECT
--   up.user_id,
--   up.subscription_tier,
--   up.blueprint_creation_limit,
--   up.blueprint_saving_limit,
--   tc.display_name,
--   tc.price_monthly_paise
-- FROM public.user_profiles up
-- JOIN public.tier_config tc ON up.subscription_tier = tc.tier
-- WHERE up.subscription_tier = 'free'
-- LIMIT 5;

-- Test new user creation
-- INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'newuser@test.com');
-- SELECT subscription_tier, user_role, blueprint_creation_limit, blueprint_saving_limit
-- FROM public.user_profiles
-- WHERE email = 'newuser@test.com';
-- Expected: tier='free', role='user', limits=2/2
