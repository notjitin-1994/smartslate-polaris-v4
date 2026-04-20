-- ============================================================================
-- Migration: Create Razorpay Payments Table
-- Description: Stores individual payment transactions and billing history
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- TABLE: payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  -- Primary Key
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Razorpay IDs
  razorpay_payment_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_order_id VARCHAR(255),
  razorpay_invoice_id VARCHAR(255),

  -- Payment Amount
  amount INTEGER NOT NULL, -- Amount in paise (₹1 = 100 paise)
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',

  -- Payment Status
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  CONSTRAINT valid_payment_status CHECK (
    status IN (
      'created',
      'authorized',
      'captured',
      'refunded',
      'failed',
      'pending'
    )
  ),

  -- Payment Method Details
  method VARCHAR(50), -- 'card', 'netbanking', 'wallet', 'upi', etc.
  card_network VARCHAR(50), -- 'Visa', 'Mastercard', 'Amex', etc.
  card_last4 VARCHAR(4), -- Last 4 digits of card
  bank VARCHAR(100), -- Bank name for netbanking/UPI
  wallet VARCHAR(50), -- Wallet name (Paytm, PhonePe, etc.)
  upi_id VARCHAR(255), -- UPI ID/VPA

  -- Billing Period (for subscription payments)
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,

  -- Error Details (for failed payments)
  error_code VARCHAR(100),
  error_description TEXT,
  error_source VARCHAR(100),
  error_step VARCHAR(100),
  error_reason TEXT,

  -- Refund Information
  refund_status VARCHAR(50),
  CONSTRAINT valid_refund_status CHECK (
    refund_status IS NULL OR refund_status IN ('null', 'partial', 'full')
  ),
  refund_amount INTEGER, -- Amount refunded in paise
  refunded_at TIMESTAMPTZ,

  -- Metadata (custom data, notes, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Payment Date
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON public.payments(deleted_at);

-- Composite index for user payment history
CREATE INDEX IF NOT EXISTS idx_payments_user_history ON public.payments(user_id, payment_date DESC)
  WHERE status IN ('captured', 'refunded');

-- Index for failed payments analysis
CREATE INDEX IF NOT EXISTS idx_payments_failed ON public.payments(user_id, error_code)
  WHERE status = 'failed';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments'
  ) THEN
    CREATE POLICY "Users can view own payments"
      ON public.payments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can insert their own payments (webhook creates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments'
  ) THEN
    CREATE POLICY "Users can insert own payments"
      ON public.payments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Users can update their own payments (webhook updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update own payments'
  ) THEN
    CREATE POLICY "Users can update own payments"
      ON public.payments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Service role has full access (for webhook processing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Service role has full access to payments'
  ) THEN
    CREATE POLICY "Service role has full access to payments"
      ON public.payments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_payments_updated_at') THEN
    CREATE TRIGGER trigger_update_payments_updated_at
      BEFORE UPDATE ON public.payments
      FOR EACH ROW
      EXECUTE FUNCTION update_payments_updated_at();
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get payment history for a user
CREATE OR REPLACE FUNCTION get_payment_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  payment_id UUID,
  razorpay_payment_id VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(3),
  status VARCHAR(50),
  method VARCHAR(50),
  payment_date TIMESTAMPTZ,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.payment_id,
    p.razorpay_payment_id,
    p.amount,
    p.currency,
    p.status,
    p.method,
    p.payment_date,
    p.billing_period_start,
    p.billing_period_end
  FROM public.payments p
  WHERE p.user_id = p_user_id
    AND p.deleted_at IS NULL
  ORDER BY p.payment_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get total revenue by user
CREATE OR REPLACE FUNCTION get_user_total_revenue(p_user_id UUID)
RETURNS TABLE(
  total_payments INTEGER,
  total_amount INTEGER,
  successful_payments INTEGER,
  failed_payments INTEGER,
  total_refunded INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_payments,
    COALESCE(SUM(CASE WHEN p.status = 'captured' THEN p.amount ELSE 0 END), 0)::INTEGER AS total_amount,
    COUNT(CASE WHEN p.status = 'captured' THEN 1 END)::INTEGER AS successful_payments,
    COUNT(CASE WHEN p.status = 'failed' THEN 1 END)::INTEGER AS failed_payments,
    COALESCE(SUM(CASE WHEN p.status = 'refunded' THEN p.refund_amount ELSE 0 END), 0)::INTEGER AS total_refunded
  FROM public.payments p
  WHERE p.user_id = p_user_id
    AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get subscription payment summary
CREATE OR REPLACE FUNCTION get_subscription_payment_summary(p_subscription_id UUID)
RETURNS TABLE(
  subscription_id UUID,
  total_payments INTEGER,
  successful_payments INTEGER,
  failed_payments INTEGER,
  total_amount_paid INTEGER,
  last_payment_date TIMESTAMPTZ,
  next_expected_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.subscription_id,
    COUNT(p.payment_id)::INTEGER AS total_payments,
    COUNT(CASE WHEN p.status = 'captured' THEN 1 END)::INTEGER AS successful_payments,
    COUNT(CASE WHEN p.status = 'failed' THEN 1 END)::INTEGER AS failed_payments,
    COALESCE(SUM(CASE WHEN p.status = 'captured' THEN p.amount ELSE 0 END), 0)::INTEGER AS total_amount_paid,
    MAX(p.payment_date) AS last_payment_date,
    s.next_billing_date AS next_expected_date
  FROM public.subscriptions s
  LEFT JOIN public.payments p ON p.subscription_id = s.subscription_id
  WHERE s.subscription_id = p_subscription_id
    AND s.deleted_at IS NULL
  GROUP BY s.subscription_id, s.next_billing_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record a successful payment (called by webhook)
CREATE OR REPLACE FUNCTION record_successful_payment(
  p_razorpay_payment_id VARCHAR(255),
  p_user_id UUID,
  p_subscription_id UUID,
  p_amount INTEGER,
  p_method VARCHAR(50),
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  INSERT INTO public.payments (
    user_id,
    subscription_id,
    razorpay_payment_id,
    amount,
    status,
    method,
    metadata,
    payment_date
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_razorpay_payment_id,
    p_amount,
    'captured',
    p_method,
    p_metadata,
    NOW()
  )
  RETURNING payment_id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.payments IS 'Stores individual Razorpay payment transactions and billing history';
COMMENT ON COLUMN public.payments.payment_id IS 'Internal UUID primary key';
COMMENT ON COLUMN public.payments.razorpay_payment_id IS 'Razorpay payment ID (pay_xxxxx)';
COMMENT ON COLUMN public.payments.amount IS 'Amount in paise (₹1 = 100 paise)';
COMMENT ON COLUMN public.payments.refund_amount IS 'Refunded amount in paise';
COMMENT ON COLUMN public.payments.billing_period_start IS 'Start of billing period for subscription payments';
COMMENT ON COLUMN public.payments.billing_period_end IS 'End of billing period for subscription payments';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.payments TO authenticated;
GRANT INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
