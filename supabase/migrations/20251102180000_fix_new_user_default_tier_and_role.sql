-- Migration: Fix new user default tier and role assignment
-- Purpose: Ensure new users get 'explorer' tier (free) and 'user' role
-- Issue: handle_new_user was assigning 'explorer' as BOTH tier AND role
-- Created: 2025-11-02

BEGIN;

-- ============================================================================
-- Fix handle_new_user function
-- ============================================================================
--
-- Correct assignment:
-- - subscription_tier: 'explorer' (the free tier with 5/5 limits)
-- - user_role: 'user' (standard user permission level)
--
-- Previous error: Was setting user_role to 'explorer' (invalid role)
-- Valid roles are: 'user', 'developer', 'admin'
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
    'explorer',  -- Free tier (0 cost, 5 blueprints/month limit)
    'user',      -- ✅ FIXED: Default role is 'user', not 'explorer'
    jsonb_build_object(
      'plan_id', 'explorer',
      'billing_cycle', 'monthly',
      'started_at', NEW.created_at,
      'renewal_date', NEW.created_at + INTERVAL '1 month',
      'usage', jsonb_build_object(
        'generations_this_month', 0,
        'saved_starmaps', 0,
        'last_reset', NOW()
      ),
      'limits', jsonb_build_object(
        'max_generations_monthly', 5,
        'max_saved_starmaps', 5
      )
    ),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS
'Automatically creates a user_profiles record when a new auth user is created.
Sets subscription_tier to ''explorer'' (free tier) and user_role to ''user'' (standard permissions).';

-- ============================================================================
-- Add validation to prevent invalid role assignments
-- ============================================================================

-- Ensure the constraint exists for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_valid_user_role'
    AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT check_valid_user_role
    CHECK (user_role IN ('user', 'developer', 'admin'));
  END IF;
END $$;

-- ============================================================================
-- Fix any existing users with invalid 'explorer' role
-- ============================================================================

UPDATE public.user_profiles
SET user_role = 'user'
WHERE user_role = 'explorer'
  AND user_role NOT IN ('user', 'developer', 'admin');

-- Log the fix
DO $$
DECLARE
  v_fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;

  IF v_fixed_count > 0 THEN
    RAISE NOTICE 'Fixed % users with invalid ''explorer'' role → ''user''', v_fixed_count;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries (run manually after migration)
-- ============================================================================

-- Verify tier configuration
-- SELECT tier, display_name, blueprint_creation_limit, price_monthly_paise
-- FROM public.tier_config
-- ORDER BY CASE tier
--   WHEN 'explorer' THEN 1
--   WHEN 'navigator' THEN 2
--   WHEN 'voyager' THEN 3
--   WHEN 'crew' THEN 4
--   WHEN 'fleet' THEN 5
--   WHEN 'armada' THEN 6
--   WHEN 'enterprise' THEN 7
--   WHEN 'developer' THEN 8
-- END;

-- Verify all users have valid roles
-- SELECT user_role, COUNT(*) as user_count
-- FROM public.user_profiles
-- GROUP BY user_role
-- ORDER BY user_count DESC;

-- Verify no users have 'explorer' as role
-- SELECT COUNT(*) as invalid_role_count
-- FROM public.user_profiles
-- WHERE user_role = 'explorer';
-- -- Expected: 0

-- Test the trigger with a new user (manual test)
-- INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
-- SELECT subscription_tier, user_role FROM public.user_profiles WHERE email = 'test@example.com';
-- -- Expected: subscription_tier='explorer', user_role='user'
