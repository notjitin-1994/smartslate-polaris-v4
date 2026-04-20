-- ============================================================================
-- Migration: Create Razorpay Webhook Events Table
-- Description: Stores webhook events for idempotency and debugging
-- Version: 1.0.0
-- Date: 2025-10-29
-- ============================================================================

-- ============================================================================
-- TABLE: webhook_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Razorpay Event ID (for idempotency)
  event_id VARCHAR(255) NOT NULL UNIQUE,

  -- Event Type
  event_type VARCHAR(100) NOT NULL,
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      -- Payment events
      'payment.authorized',
      'payment.captured',
      'payment.failed',
      'payment.pending',
      -- Subscription events
      'subscription.authenticated',
      'subscription.activated',
      'subscription.charged',
      'subscription.completed',
      'subscription.cancelled',
      'subscription.halted',
      'subscription.paused',
      'subscription.resumed',
      'subscription.pending',
      -- Order events
      'order.paid',
      -- Refund events
      'refund.created',
      'refund.processed'
    )
  ),

  -- Razorpay Account ID
  account_id VARCHAR(255),

  -- Full Webhook Payload (for debugging and reprocessing)
  payload JSONB NOT NULL,

  -- Processing Status
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  CONSTRAINT valid_processing_status CHECK (
    processing_status IN ('pending', 'processing', 'processed', 'failed', 'skipped')
  ),

  -- Processing Metadata
  processing_attempts INTEGER NOT NULL DEFAULT 0,
  processing_error TEXT,
  processing_started_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,

  -- Webhook Signature Verification
  signature VARCHAR(500),
  signature_verified BOOLEAN DEFAULT FALSE,

  -- Related Entity IDs (extracted from payload for quick lookup)
  related_subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  related_payment_id UUID REFERENCES public.payments(payment_id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processing_status ON public.webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_related_subscription_id ON public.webhook_events(related_subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_related_payment_id ON public.webhook_events(related_payment_id);

-- Index for unprocessed webhooks
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed ON public.webhook_events(created_at DESC)
  WHERE processing_status IN ('pending', 'failed');

-- Index for signature verification
CREATE INDEX IF NOT EXISTS idx_webhook_events_unverified ON public.webhook_events(created_at DESC)
  WHERE signature_verified = FALSE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access webhook events (security-sensitive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Service role has full access to webhook events'
  ) THEN
    CREATE POLICY "Service role has full access to webhook events"
      ON public.webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: Authenticated users cannot access webhook events directly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Authenticated users cannot access webhook events'
  ) THEN
    CREATE POLICY "Authenticated users cannot access webhook events"
      ON public.webhook_events
      FOR ALL
      TO authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_webhook_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_webhook_events_updated_at') THEN
    CREATE TRIGGER trigger_update_webhook_events_updated_at
      BEFORE UPDATE ON public.webhook_events
      FOR EACH ROW
      EXECUTE FUNCTION update_webhook_events_updated_at();
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if webhook event already processed (idempotency)
CREATE OR REPLACE FUNCTION is_webhook_event_processed(p_event_id VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.webhook_events
    WHERE event_id = p_event_id
      AND processing_status IN ('processed', 'skipped')
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record webhook event (for idempotency and debugging)
CREATE OR REPLACE FUNCTION record_webhook_event(
  p_event_id VARCHAR(255),
  p_event_type VARCHAR(100),
  p_account_id VARCHAR(255),
  p_payload JSONB,
  p_signature VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_webhook_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if event already exists (idempotency)
  SELECT id INTO v_existing_id
  FROM public.webhook_events
  WHERE event_id = p_event_id;

  IF v_existing_id IS NOT NULL THEN
    -- Event already exists, return existing ID
    RETURN v_existing_id;
  END IF;

  -- Insert new webhook event
  INSERT INTO public.webhook_events (
    event_id,
    event_type,
    account_id,
    payload,
    signature,
    processing_status
  ) VALUES (
    p_event_id,
    p_event_type,
    p_account_id,
    p_payload,
    p_signature,
    'pending'
  )
  RETURNING id INTO v_webhook_id;

  RETURN v_webhook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark webhook as processed
CREATE OR REPLACE FUNCTION mark_webhook_processed(
  p_event_id VARCHAR(255),
  p_related_subscription_id UUID DEFAULT NULL,
  p_related_payment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  UPDATE public.webhook_events
  SET
    processing_status = 'processed',
    processed_at = NOW(),
    related_subscription_id = COALESCE(p_related_subscription_id, related_subscription_id),
    related_payment_id = COALESCE(p_related_payment_id, related_payment_id),
    updated_at = NOW()
  WHERE event_id = p_event_id
    AND processing_status != 'processed';

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark webhook as failed
CREATE OR REPLACE FUNCTION mark_webhook_failed(
  p_event_id VARCHAR(255),
  p_error_message TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  UPDATE public.webhook_events
  SET
    processing_status = 'failed',
    processing_error = p_error_message,
    processing_attempts = processing_attempts + 1,
    updated_at = NOW()
  WHERE event_id = p_event_id;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify webhook signature
CREATE OR REPLACE FUNCTION verify_webhook_signature(
  p_event_id VARCHAR(255),
  p_is_valid BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  UPDATE public.webhook_events
  SET
    signature_verified = p_is_valid,
    updated_at = NOW()
  WHERE event_id = p_event_id;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get unprocessed webhooks (for retry/debugging)
CREATE OR REPLACE FUNCTION get_unprocessed_webhooks(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(
  id UUID,
  event_id VARCHAR(255),
  event_type VARCHAR(100),
  payload JSONB,
  processing_attempts INTEGER,
  processing_error TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.event_id,
    w.event_type,
    w.payload,
    w.processing_attempts,
    w.processing_error,
    w.created_at
  FROM public.webhook_events w
  WHERE w.processing_status IN ('pending', 'failed')
    AND w.processing_attempts < 5 -- Max 5 retry attempts
  ORDER BY w.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get webhook event statistics
CREATE OR REPLACE FUNCTION get_webhook_statistics()
RETURNS TABLE(
  total_events INTEGER,
  processed_events INTEGER,
  pending_events INTEGER,
  failed_events INTEGER,
  average_processing_time_seconds NUMERIC,
  events_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_events,
    COUNT(CASE WHEN processing_status = 'processed' THEN 1 END)::INTEGER AS processed_events,
    COUNT(CASE WHEN processing_status = 'pending' THEN 1 END)::INTEGER AS pending_events,
    COUNT(CASE WHEN processing_status = 'failed' THEN 1 END)::INTEGER AS failed_events,
    AVG(
      CASE
        WHEN processed_at IS NOT NULL AND processing_started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (processed_at - processing_started_at))
        ELSE NULL
      END
    )::NUMERIC AS average_processing_time_seconds,
    jsonb_object_agg(
      event_type,
      COUNT(*)
    ) AS events_by_type
  FROM public.webhook_events
  GROUP BY TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.webhook_events IS 'Stores Razorpay webhook events for idempotency, debugging, and reprocessing';
COMMENT ON COLUMN public.webhook_events.event_id IS 'Razorpay event ID (unique, used for idempotency)';
COMMENT ON COLUMN public.webhook_events.payload IS 'Full webhook payload from Razorpay (JSONB for debugging)';
COMMENT ON COLUMN public.webhook_events.processing_status IS 'Current processing status of the webhook';
COMMENT ON COLUMN public.webhook_events.signature_verified IS 'Whether webhook signature was verified using RAZORPAY_WEBHOOK_SECRET';
COMMENT ON COLUMN public.webhook_events.related_subscription_id IS 'Link to subscriptions table (extracted from payload)';
COMMENT ON COLUMN public.webhook_events.related_payment_id IS 'Link to payments table (extracted from payload)';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Only service role can access webhook_events (security-sensitive)
GRANT ALL ON public.webhook_events TO service_role;
