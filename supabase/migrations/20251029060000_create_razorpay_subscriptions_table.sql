-- ============================================================================
-- Migration: Create Razorpay Subscriptions Table
-- Description: Stores Razorpay subscription data and syncs with user_profiles
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  -- Primary Key
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Razorpay IDs
  razorpay_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_plan_id VARCHAR(255) NOT NULL,
  razorpay_customer_id VARCHAR(255),

  -- Subscription Status
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  CONSTRAINT valid_subscription_status CHECK (
    status IN (
      'created',
      'authenticated',
      'active',
      'halted',
      'cancelled',
      'completed',
      'expired',
      'paused'
    )
  ),

  -- Plan Details
  plan_name VARCHAR(100) NOT NULL,
  plan_amount INTEGER NOT NULL, -- Amount in paise (₹1 = 100 paise)
  plan_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  plan_period VARCHAR(20) NOT NULL, -- 'monthly' or 'yearly'
  plan_interval INTEGER NOT NULL DEFAULT 1,

  -- Subscription Tier (from pricing.md)
  subscription_tier VARCHAR(50) NOT NULL,
  CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN (
      'free',
      'explorer',
      'navigator',
      'voyager',
      'crew',
      'fleet',
      'armada'
    )
  ),

  -- Billing Dates (ISO 8601 timestamps)
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  current_start TIMESTAMPTZ,
  current_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  charge_at TIMESTAMPTZ,

  -- Billing Cycle Tracking
  total_count INTEGER NOT NULL DEFAULT 12, -- Total billing cycles (12 for monthly, 1 for yearly)
  paid_count INTEGER NOT NULL DEFAULT 0,
  remaining_count INTEGER NOT NULL DEFAULT 12,

  -- Payment Method (stored as JSONB for flexibility)
  payment_method JSONB,

  -- Metadata (custom data, notes, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Razorpay Short URL (for payment link)
  short_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription_id ON public.subscriptions(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_tier ON public.subscriptions(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at ON public.subscriptions(deleted_at);

-- Composite index for active subscriptions per user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id, status)
  WHERE status IN ('active', 'authenticated');

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own subscriptions') THEN
    CREATE POLICY "Users can view own subscriptions"
      ON public.subscriptions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can insert their own subscriptions (webhook creates)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own subscriptions') THEN
    CREATE POLICY "Users can insert own subscriptions"
      ON public.subscriptions
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can update their own subscriptions (webhook updates)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own subscriptions') THEN
    CREATE POLICY "Users can update own subscriptions"
      ON public.subscriptions
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Service role has full access (for webhook processing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role has full access to subscriptions') THEN
    CREATE POLICY "Service role has full access to subscriptions"
      ON public.subscriptions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_subscriptions_updated_at') THEN
    CREATE TRIGGER trigger_update_subscriptions_updated_at
      BEFORE UPDATE ON public.subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_subscriptions_updated_at();
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get active subscription for a user
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS TABLE(
  subscription_id UUID,
  razorpay_subscription_id VARCHAR(255),
  plan_name VARCHAR(100),
  plan_amount INTEGER,
  subscription_tier VARCHAR(50),
  status VARCHAR(50),
  next_billing_date TIMESTAMPTZ,
  remaining_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.subscription_id,
    s.razorpay_subscription_id,
    s.plan_name,
    s.plan_amount,
    s.subscription_tier,
    s.status,
    s.next_billing_date,
    s.remaining_count
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'authenticated')
    AND s.deleted_at IS NULL
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel subscription (soft cancellation)
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_subscription_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  UPDATE public.subscriptions
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE
    subscription_id = p_subscription_id
    AND user_id = p_user_id
    AND status NOT IN ('cancelled', 'completed', 'expired')
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Sync subscription status with user_profiles
CREATE OR REPLACE FUNCTION sync_subscription_to_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_blueprint_limit INTEGER;
BEGIN
  -- Determine blueprint limit based on subscription tier
  v_blueprint_limit := CASE NEW.subscription_tier
    WHEN 'free' THEN 2
    WHEN 'explorer' THEN 5
    WHEN 'navigator' THEN 25
    WHEN 'voyager' THEN 50
    WHEN 'crew' THEN 10
    WHEN 'fleet' THEN 30
    WHEN 'armada' THEN 60
    ELSE 2
  END;

  -- Update user_profiles when subscription becomes active
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    UPDATE public.user_profiles
    SET
      subscription_tier = NEW.subscription_tier,
      user_role = NEW.subscription_tier,
      blueprint_creation_limit = v_blueprint_limit,
      blueprint_saving_limit = v_blueprint_limit,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  -- Downgrade to free tier when subscription is cancelled/expired/completed
  IF NEW.status IN ('cancelled', 'expired', 'completed')
     AND (OLD IS NULL OR OLD.status NOT IN ('cancelled', 'expired', 'completed')) THEN
    UPDATE public.user_profiles
    SET
      subscription_tier = 'explorer',
      user_role = 'explorer',
      blueprint_creation_limit = 2,
      blueprint_saving_limit = 2,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_subscription_to_user_profile
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_to_user_profile();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.subscriptions IS 'Stores Razorpay subscription data with automatic user_profiles sync';
COMMENT ON COLUMN public.subscriptions.subscription_id IS 'Internal UUID primary key';
COMMENT ON COLUMN public.subscriptions.razorpay_subscription_id IS 'Razorpay subscription ID (sub_xxxxx)';
COMMENT ON COLUMN public.subscriptions.plan_amount IS 'Amount in paise (₹1 = 100 paise)';
COMMENT ON COLUMN public.subscriptions.subscription_tier IS 'Subscription tier from pricing.md';
COMMENT ON COLUMN public.subscriptions.total_count IS 'Total billing cycles (12 for monthly, 1 for yearly)';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
