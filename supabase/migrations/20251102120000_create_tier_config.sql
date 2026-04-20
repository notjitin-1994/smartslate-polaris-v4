-- Migration: Create centralized tier configuration table
-- Purpose: Fix CVE-002 - Eliminate hard-coded tier limits scattered across codebase
-- Created: 2025-11-02

-- Create centralized tier configuration table
CREATE TABLE IF NOT EXISTS public.tier_config (
  tier TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  blueprint_creation_limit INTEGER NOT NULL,
  blueprint_saving_limit INTEGER NOT NULL,
  is_team_tier BOOLEAN NOT NULL DEFAULT false,
  price_monthly_paise INTEGER,
  price_yearly_paise INTEGER,
  razorpay_plan_id_monthly TEXT,
  razorpay_plan_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_valid_tier CHECK (
    tier IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer')
  ),
  CONSTRAINT check_valid_limits CHECK (
    -- -1 represents unlimited
    (blueprint_creation_limit >= -1) AND (blueprint_saving_limit >= -1)
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tier_config_tier ON public.tier_config(tier);

-- Populate with current configuration (matching existing hard-coded values)
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
) VALUES
  -- Personal Tiers
  ('explorer', 'Explorer', 5, 5, false, 0, 0, NULL, NULL,
   '{"description": "Free tier with basic features", "rollover": false, "support": "community"}'),

  ('navigator', 'Navigator', 25, 25, false, 159900, 1599000,
   'plan_PBUXUjO6dJfKFa', 'plan_PBUaZC8FMcHnqG',
   '{"description": "Individual professional tier", "rollover": true, "support": "email"}'),

  ('voyager', 'Voyager', 50, 50, false, 349900, 3499000,
   'plan_PBUdJP0vqBGY0x', 'plan_PBUfXPD9VQVnQ0',
   '{"description": "Advanced individual tier", "rollover": true, "support": "priority"}'),

  -- Team Tiers
  ('crew', 'Crew', 10, 10, true, 199900, 1999000,
   'plan_PBUjXqvOH42Szf', 'plan_PBUlOiEgMbCVzY',
   '{"description": "Small team tier", "rollover": true, "support": "priority", "collaboration": true}'),

  ('fleet', 'Fleet', 30, 30, true, 539900, 5399000,
   'plan_PBUrQTuRSaJSyP', 'plan_PBUsLjJI76hSI0',
   '{"description": "Medium team tier", "rollover": true, "support": "priority", "collaboration": true}'),

  ('armada', 'Armada', 60, 60, true, 1089900, 10899000,
   'plan_PBUumKoW7Q0YcN', 'plan_PBUwHqnzGF3DWr',
   '{"description": "Large team tier", "rollover": true, "support": "dedicated", "collaboration": true}'),

  -- Special Tiers
  ('enterprise', 'Enterprise', -1, -1, true, NULL, NULL, NULL, NULL,
   '{"description": "Custom enterprise tier", "rollover": false, "support": "dedicated", "custom": true}'),

  ('developer', 'Developer', -1, -1, false, NULL, NULL, NULL, NULL,
   '{"description": "Developer tier with full access", "rollover": false, "support": "priority", "admin": true}')
ON CONFLICT (tier) DO NOTHING;

-- Function to get tier limits
CREATE OR REPLACE FUNCTION public.get_tier_limits(p_tier TEXT)
RETURNS TABLE(
  creation_limit INTEGER,
  saving_limit INTEGER,
  is_unlimited BOOLEAN,
  display_name TEXT
)
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.blueprint_creation_limit,
    tc.blueprint_saving_limit,
    (tc.blueprint_creation_limit = -1 OR tc.blueprint_saving_limit = -1) AS is_unlimited,
    tc.display_name
  FROM public.tier_config tc
  WHERE tc.tier = p_tier;

  -- If tier not found, return minimal limits (fail-closed)
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, false, 'Unknown'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tier configurations (for admin/pricing pages)
CREATE OR REPLACE FUNCTION public.get_all_tier_configs()
RETURNS TABLE(
  tier TEXT,
  display_name TEXT,
  creation_limit INTEGER,
  saving_limit INTEGER,
  is_team_tier BOOLEAN,
  price_monthly_paise INTEGER,
  price_yearly_paise INTEGER,
  features JSONB
)
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.tier,
    tc.display_name,
    tc.blueprint_creation_limit,
    tc.blueprint_saving_limit,
    tc.is_team_tier,
    tc.price_monthly_paise,
    tc.price_yearly_paise,
    tc.features
  FROM public.tier_config tc
  WHERE tc.tier NOT IN ('developer') -- Hide developer tier from public listings
  ORDER BY
    CASE
      WHEN tc.tier = 'explorer' THEN 1
      WHEN tc.tier = 'navigator' THEN 2
      WHEN tc.tier = 'voyager' THEN 3
      WHEN tc.tier = 'crew' THEN 4
      WHEN tc.tier = 'fleet' THEN 5
      WHEN tc.tier = 'armada' THEN 6
      WHEN tc.tier = 'enterprise' THEN 7
      ELSE 99
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on tier_config changes
CREATE OR REPLACE FUNCTION public.update_tier_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_tier_config_updated_at') THEN
    CREATE TRIGGER trigger_update_tier_config_updated_at
      BEFORE UPDATE ON public.tier_config
      FOR EACH ROW
      EXECUTE FUNCTION public.update_tier_config_updated_at();
  END IF;
END $$;

-- Grant appropriate permissions
GRANT SELECT ON public.tier_config TO authenticated;
GRANT SELECT ON public.tier_config TO anon;

-- Enable RLS (but allow all authenticated users to read)
ALTER TABLE public.tier_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tier_config' AND policyname = 'Allow all to read tier configurations'
  ) THEN
    CREATE POLICY "Allow all to read tier configurations"
      ON public.tier_config
      FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;
END $$;

-- Only service role can modify tier configurations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tier_config' AND policyname = 'Only service role can modify tier configurations'
  ) THEN
    CREATE POLICY "Only service role can modify tier configurations"
      ON public.tier_config
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE public.tier_config IS 'Centralized tier configuration table - single source of truth for all tier limits and pricing. Fixes CVE-002.';
COMMENT ON COLUMN public.tier_config.blueprint_creation_limit IS 'Number of blueprints that can be created per month. -1 means unlimited.';
COMMENT ON COLUMN public.tier_config.blueprint_saving_limit IS 'Number of blueprints that can be saved per month. -1 means unlimited.';
