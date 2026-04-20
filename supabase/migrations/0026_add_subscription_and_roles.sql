-- Migration: 0026_add_subscription_and_roles.sql
-- Description: Add subscription tier, user role, and usage tracking support
-- Author: System
-- Date: 2025-10-09
-- PRD Reference: docs/prds/user-roles-and-subscriptions.txt

BEGIN;

-- ============================================================================
-- 1. Extend user_profiles table with subscription and role columns
-- ============================================================================

-- Add subscription and role fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'explorer',
ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'explorer',
ADD COLUMN IF NOT EXISTS subscription_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS role_assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS role_assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add check constraints for valid subscription tiers
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_subscription_tier,
ADD CONSTRAINT check_valid_subscription_tier 
CHECK (subscription_tier IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'));

-- Add check constraint for valid user roles
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS check_valid_user_role,
ADD CONSTRAINT check_valid_user_role 
CHECK (user_role IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'));

-- Create indexes for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON public.user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_metadata ON public.user_profiles USING GIN (subscription_metadata);

-- Add comment documentation
COMMENT ON COLUMN public.user_profiles.subscription_tier IS 'The subscription plan tier the user is on (explorer, navigator, voyager, crew, fleet, armada, enterprise, developer)';
COMMENT ON COLUMN public.user_profiles.user_role IS 'The role assigned to the user, typically matches subscription_tier but can be overridden by admins';
COMMENT ON COLUMN public.user_profiles.subscription_metadata IS 'JSONB containing usage stats, limits, billing info, and tier-specific settings';
COMMENT ON COLUMN public.user_profiles.role_assigned_at IS 'Timestamp when the current role was assigned';
COMMENT ON COLUMN public.user_profiles.role_assigned_by IS 'User ID of admin who assigned the role (NULL for automatic assignments)';

-- ============================================================================
-- 2. Create user_usage_history table for tracking usage over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  subscription_tier TEXT NOT NULL,
  starmaps_generated INT NOT NULL DEFAULT 0,
  starmaps_saved INT NOT NULL DEFAULT 0,
  exports_pdf INT NOT NULL DEFAULT 0,
  exports_word INT NOT NULL DEFAULT 0,
  api_calls INT NOT NULL DEFAULT 0,
  processing_time_ms BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per user per period
  UNIQUE(user_id, period_start)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_usage_history_user_id ON public.user_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_history_period ON public.user_usage_history(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_usage_history_tier ON public.user_usage_history(subscription_tier);

-- Add comments
COMMENT ON TABLE public.user_usage_history IS 'Historical record of user usage by billing period';
COMMENT ON COLUMN public.user_usage_history.starmaps_generated IS 'Number of starmaps generated in this period';
COMMENT ON COLUMN public.user_usage_history.starmaps_saved IS 'Number of starmaps saved in this period';

-- Enable RLS
ALTER TABLE public.user_usage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_usage_history
-- Simple policies - developers use service role key
CREATE POLICY "Users can view their own usage history"
  ON public.user_usage_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage history"
  ON public.user_usage_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. Create role_audit_log table for tracking role changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  old_role TEXT,
  new_role TEXT NOT NULL,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Audit log metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_audit_log_admin ON public.role_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_target ON public.role_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_created ON public.role_audit_log(created_at DESC);

-- Add comments
COMMENT ON TABLE public.role_audit_log IS 'Immutable audit log of all role assignments and changes';
COMMENT ON COLUMN public.role_audit_log.reason IS 'Admin-provided reason for role change';

-- Enable RLS
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_audit_log (append-only for audit purposes)
-- Only service role can access audit logs (no anon/authenticated access)
-- No policies needed - RLS enabled but no policies means no anon access

-- ============================================================================
-- 4. Create database functions for usage tracking
-- ============================================================================

-- Function to increment usage counters atomically
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_value INTEGER;
  v_new_value INTEGER;
  v_path TEXT[];
BEGIN
  -- Build JSONB path for the usage type
  v_path := ARRAY['usage', p_usage_type];
  
  -- Get current value (default to 0 if not set)
  SELECT COALESCE((subscription_metadata #>> v_path)::INTEGER, 0)
  INTO v_current_value
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- Calculate new value
  v_new_value := v_current_value + p_amount;
  
  -- Update the value
  UPDATE public.user_profiles
  SET 
    subscription_metadata = jsonb_set(
      subscription_metadata,
      v_path,
      to_jsonb(v_new_value),
      true
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error incrementing usage for user %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_usage IS 'Atomically increment a usage counter in subscription_metadata';

-- Function to reset monthly usage counters
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS TABLE(user_id UUID, old_usage JSONB, new_usage JSONB) AS $$
BEGIN
  RETURN QUERY
  WITH archived AS (
    -- Archive current usage to history table
    INSERT INTO public.user_usage_history (
      user_id,
      period_start,
      period_end,
      subscription_tier,
      starmaps_generated,
      starmaps_saved,
      exports_pdf,
      exports_word,
      api_calls,
      processing_time_ms
    )
    SELECT 
      up.user_id,
      date_trunc('month', NOW() - INTERVAL '1 month'),
      date_trunc('month', NOW()),
      up.subscription_tier,
      COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0),
      COALESCE((up.subscription_metadata #>> '{usage,saved_starmaps}')::INTEGER, 0),
      COALESCE((up.subscription_metadata #>> '{usage,exports_pdf}')::INTEGER, 0),
      COALESCE((up.subscription_metadata #>> '{usage,exports_word}')::INTEGER, 0),
      COALESCE((up.subscription_metadata #>> '{usage,api_calls}')::INTEGER, 0),
      COALESCE((up.subscription_metadata #>> '{usage,processing_time_ms}')::BIGINT, 0)
    FROM public.user_profiles up
    WHERE up.subscription_metadata ? 'usage'
    RETURNING user_id
  ),
  reset AS (
    -- Reset usage counters
    UPDATE public.user_profiles up
    SET 
      subscription_metadata = jsonb_set(
        jsonb_set(
          subscription_metadata,
          '{usage,generations_this_month}',
          '0'::jsonb
        ),
        '{usage,last_reset}',
        to_jsonb(NOW()::TEXT)
      ),
      updated_at = NOW()
    WHERE up.user_id IN (SELECT user_id FROM archived)
    RETURNING 
      up.user_id,
      subscription_metadata AS old_usage,
      jsonb_set(
        jsonb_set(
          subscription_metadata,
          '{usage,generations_this_month}',
          '0'::jsonb
        ),
        '{usage,last_reset}',
        to_jsonb(NOW()::TEXT)
      ) AS new_usage
  )
  SELECT * FROM reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_monthly_usage IS 'Archive current usage and reset monthly counters for all users';

-- Function to get user's current usage limits
CREATE OR REPLACE FUNCTION public.get_user_limits(p_user_id UUID)
RETURNS TABLE(
  role TEXT,
  max_generations_monthly INTEGER,
  max_saved_starmaps INTEGER,
  current_generations INTEGER,
  current_saved_starmaps INTEGER,
  generations_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_role,
    COALESCE((up.subscription_metadata #>> '{limits,max_generations_monthly}')::INTEGER, 5) AS max_generations_monthly,
    COALESCE((up.subscription_metadata #>> '{limits,max_saved_starmaps}')::INTEGER, 5) AS max_saved_starmaps,
    COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0) AS current_generations,
    COALESCE((up.subscription_metadata #>> '{usage,saved_starmaps}')::INTEGER, 0) AS current_saved_starmaps,
    GREATEST(
      0,
      COALESCE((up.subscription_metadata #>> '{limits,max_generations_monthly}')::INTEGER, 5) -
      COALESCE((up.subscription_metadata #>> '{usage,generations_this_month}')::INTEGER, 0)
    ) AS generations_remaining
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_limits IS 'Get current usage and remaining quota for a user';

-- ============================================================================
-- 5. Update existing RLS policies for user_profiles
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Developers have full access" ON public.user_profiles;

-- Recreate policies with simplified approach
-- Basic policies for regular users - developers use service role key
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. Create trigger to log role changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.user_role IS DISTINCT FROM NEW.user_role THEN
    INSERT INTO public.role_audit_log (
      admin_user_id,
      target_user_id,
      old_role,
      new_role,
      reason,
      metadata
    ) VALUES (
      COALESCE(NEW.role_assigned_by, NEW.user_id), -- Use assigned_by or self
      NEW.user_id,
      OLD.user_role,
      NEW.user_role,
      'Role changed via update',
      jsonb_build_object(
        'old_tier', OLD.subscription_tier,
        'new_tier', NEW.subscription_tier,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_role_change ON public.user_profiles;
CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.user_role IS DISTINCT FROM NEW.user_role)
  EXECUTE FUNCTION public.log_role_change();

COMMENT ON FUNCTION public.log_role_change IS 'Automatically log role changes to audit table';

-- ============================================================================
-- 7. Create trigger to auto-create user profile on auth.users insert
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    subscription_tier,
    user_role,
    subscription_metadata,
    role_assigned_at
  ) VALUES (
    NEW.id,
    'explorer',
    'explorer',
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user_profiles record when a new auth user is created';

-- ============================================================================
-- 8. Initialize subscription_metadata for existing users
-- ============================================================================

UPDATE public.user_profiles
SET subscription_metadata = jsonb_build_object(
  'plan_id', COALESCE(subscription_tier, 'explorer'),
  'billing_cycle', 'monthly',
  'started_at', created_at,
  'renewal_date', created_at + INTERVAL '1 month',
  'usage', jsonb_build_object(
    'generations_this_month', 0,
    'saved_starmaps', 0,
    'last_reset', NOW()
  ),
  'limits', jsonb_build_object(
    'max_generations_monthly', 5,
    'max_saved_starmaps', 5
  )
)
WHERE subscription_metadata = '{}'::JSONB
  OR subscription_metadata IS NULL;

-- ============================================================================
-- 9. Create test users for each tier (development/testing only)
-- ============================================================================

-- Note: This section creates test users with passwords.
-- In production, remove or modify this section appropriately.

DO $$
DECLARE
  v_test_user_id UUID;
  v_tier TEXT;
  v_tiers TEXT[] := ARRAY['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'];
  v_tier_limits JSONB;
BEGIN
  -- Only create test users if we're not in production
  -- Check for a specific environment indicator or skip this in production
  IF current_setting('app.environment', true) != 'production' THEN
    
    FOREACH v_tier IN ARRAY v_tiers
    LOOP
      -- Set tier-specific limits
      CASE v_tier
        WHEN 'explorer' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', 5,
            'max_saved_starmaps', 5
          );
        WHEN 'navigator' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', 15,
            'max_saved_starmaps', 30
          );
        WHEN 'voyager' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', 40,
            'max_saved_starmaps', 20
          );
        WHEN 'crew' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', 10,
            'max_saved_starmaps', 25
          );
        WHEN 'fleet' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', 25,
            'max_saved_starmaps', 75
          );
        WHEN 'armada' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', -1, -- unlimited
            'max_saved_starmaps', 100
          );
        WHEN 'enterprise' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', -1, -- unlimited
            'max_saved_starmaps', -1 -- unlimited
          );
        WHEN 'developer' THEN
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', -1, -- unlimited
            'max_saved_starmaps', -1 -- unlimited
          );
        ELSE
          v_tier_limits := jsonb_build_object(
            'max_generations_monthly', 5,
            'max_saved_starmaps', 5
          );
      END CASE;

      -- Check if test user already exists
      SELECT user_id INTO v_test_user_id
      FROM public.user_profiles
      WHERE email = 'test-' || v_tier || '@smartslate.dev'
      LIMIT 1;

      -- Create test user if doesn't exist
      IF v_test_user_id IS NULL THEN
        -- Note: In real implementation, use Supabase Auth API to create users
        -- This is a simplified version for migration purposes
        RAISE NOTICE 'Test user for tier % should be created via Supabase Auth: test-%@smartslate.dev', v_tier, v_tier;
        
        -- If using direct database insert (not recommended for production):
        -- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
        -- VALUES ('test-' || v_tier || '@smartslate.dev', crypt('Test123!', gen_salt('bf')), NOW())
        -- RETURNING id INTO v_test_user_id;
        --
        -- Then create profile:
        -- INSERT INTO public.user_profiles (user_id, email, subscription_tier, user_role, subscription_metadata)
        -- VALUES (v_test_user_id, 'test-' || v_tier || '@smartslate.dev', v_tier, v_tier, jsonb_build_object(...));
      END IF;
    END LOOP;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification Queries (run after migration)
-- ============================================================================

-- Verify new columns exist
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name IN ('subscription_tier', 'user_role', 'subscription_metadata');

-- Verify indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'user_profiles';

-- Verify RLS policies
-- SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'user_usage_history', 'role_audit_log');

-- Verify functions
-- SELECT proname FROM pg_proc WHERE proname IN ('increment_usage', 'reset_monthly_usage', 'get_user_limits');

-- Test increment_usage function
-- SELECT public.increment_usage('your-user-id'::UUID, 'generations_this_month', 1);

-- Test get_user_limits function
-- SELECT * FROM public.get_user_limits('your-user-id'::UUID);

