-- Migration: Create email_notifications_log table
-- Description: Track all email notifications sent to users
-- Author: SmartSlate Team
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- CREATE EMAIL_NOTIFICATIONS_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_notifications_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (nullable for system-wide emails)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Email details
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),

  -- Provider info (Resend)
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_id TEXT,  -- ID returned by email provider
  provider_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Template and content
  template_id TEXT,
  template_data JSONB DEFAULT '{}'::jsonb,

  -- Engagement metrics
  opens_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying by user_id
CREATE INDEX IF NOT EXISTS idx_email_log_user_id
  ON public.email_notifications_log(user_id)
  WHERE user_id IS NOT NULL;

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_email_log_status
  ON public.email_notifications_log(status);

-- Index for querying by email_type
CREATE INDEX IF NOT EXISTS idx_email_log_type
  ON public.email_notifications_log(email_type);

-- Index for finding pending emails to send
CREATE INDEX IF NOT EXISTS idx_email_log_pending
  ON public.email_notifications_log(created_at ASC)
  WHERE status = 'pending';

-- Index for finding failed emails to retry
CREATE INDEX IF NOT EXISTS idx_email_log_failed_retry
  ON public.email_notifications_log(created_at DESC)
  WHERE status = 'failed' AND retry_count < 3;

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_email_log_created_at
  ON public.email_notifications_log(created_at DESC);

-- Index for provider lookups
CREATE INDEX IF NOT EXISTS idx_email_log_provider_id
  ON public.email_notifications_log(provider_id)
  WHERE provider_id IS NOT NULL;

-- GIN indexes for JSONB searches
CREATE INDEX IF NOT EXISTS idx_email_log_provider_metadata
  ON public.email_notifications_log USING GIN (provider_metadata);

CREATE INDEX IF NOT EXISTS idx_email_log_template_data
  ON public.email_notifications_log USING GIN (template_data);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.email_notifications_log IS 'Audit log of all email notifications sent through the platform';
COMMENT ON COLUMN public.email_notifications_log.id IS 'Unique identifier for the email log entry';
COMMENT ON COLUMN public.email_notifications_log.user_id IS 'User who received the email (null for system-wide emails)';
COMMENT ON COLUMN public.email_notifications_log.recipient_email IS 'Email address where notification was sent';
COMMENT ON COLUMN public.email_notifications_log.email_type IS 'Type of email (blueprint_complete, password_reset, welcome, etc.)';
COMMENT ON COLUMN public.email_notifications_log.subject IS 'Email subject line';
COMMENT ON COLUMN public.email_notifications_log.status IS 'Current status of the email';
COMMENT ON COLUMN public.email_notifications_log.provider IS 'Email service provider (resend, sendgrid, etc.)';
COMMENT ON COLUMN public.email_notifications_log.provider_id IS 'ID returned by the email provider';
COMMENT ON COLUMN public.email_notifications_log.provider_metadata IS 'Additional metadata from the provider';
COMMENT ON COLUMN public.email_notifications_log.sent_at IS 'When the email was sent to the provider';
COMMENT ON COLUMN public.email_notifications_log.delivered_at IS 'When the email was delivered to recipient';
COMMENT ON COLUMN public.email_notifications_log.opened_at IS 'When the email was first opened';
COMMENT ON COLUMN public.email_notifications_log.clicked_at IS 'When a link in the email was first clicked';
COMMENT ON COLUMN public.email_notifications_log.failed_at IS 'When the email send failed';
COMMENT ON COLUMN public.email_notifications_log.error_message IS 'Error message if send failed';
COMMENT ON COLUMN public.email_notifications_log.error_code IS 'Error code from provider';
COMMENT ON COLUMN public.email_notifications_log.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN public.email_notifications_log.template_id IS 'Email template identifier';
COMMENT ON COLUMN public.email_notifications_log.template_data IS 'Data passed to the template';
COMMENT ON COLUMN public.email_notifications_log.opens_count IS 'Total number of times email was opened';
COMMENT ON COLUMN public.email_notifications_log.clicks_count IS 'Total number of clicks on links in email';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON public.email_notifications_log FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all email logs
CREATE POLICY "Service role can manage all email logs"
  ON public.email_notifications_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can view all email logs (for debugging)
CREATE POLICY "Admins can view all email logs"
  ON public.email_notifications_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'developer')
    )
  );

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_email_notifications_log_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_email_notifications_log_updated_at
  BEFORE UPDATE ON public.email_notifications_log
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_log_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create email log entry
CREATE OR REPLACE FUNCTION log_email_notification(
  p_user_id UUID,
  p_recipient_email TEXT,
  p_email_type TEXT,
  p_subject TEXT,
  p_template_id TEXT DEFAULT NULL,
  p_template_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.email_notifications_log (
    user_id,
    recipient_email,
    email_type,
    subject,
    template_id,
    template_data,
    status
  )
  VALUES (
    p_user_id,
    p_recipient_email,
    p_email_type,
    p_subject,
    p_template_id,
    p_template_data,
    'pending'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_log_id UUID,
  p_provider_id TEXT,
  p_provider_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_notifications_log
  SET
    status = 'sent',
    sent_at = NOW(),
    provider_id = p_provider_id,
    provider_metadata = p_provider_metadata,
    updated_at = NOW()
  WHERE id = p_log_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function to mark email as delivered
CREATE OR REPLACE FUNCTION mark_email_delivered(p_provider_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_notifications_log
  SET
    status = 'delivered',
    delivered_at = NOW(),
    updated_at = NOW()
  WHERE provider_id = p_provider_id
    AND status = 'sent';

  RETURN FOUND;
END;
$$;

-- Function to mark email as opened
CREATE OR REPLACE FUNCTION mark_email_opened(p_provider_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_notifications_log
  SET
    status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
    opened_at = CASE WHEN opened_at IS NULL THEN NOW() ELSE opened_at END,
    opens_count = opens_count + 1,
    updated_at = NOW()
  WHERE provider_id = p_provider_id;

  RETURN FOUND;
END;
$$;

-- Function to mark email as clicked
CREATE OR REPLACE FUNCTION mark_email_clicked(p_provider_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_notifications_log
  SET
    status = 'clicked',
    clicked_at = CASE WHEN clicked_at IS NULL THEN NOW() ELSE clicked_at END,
    clicks_count = clicks_count + 1,
    updated_at = NOW()
  WHERE provider_id = p_provider_id;

  RETURN FOUND;
END;
$$;

-- Function to mark email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_log_id UUID,
  p_error_message TEXT,
  p_error_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.email_notifications_log
  SET
    status = 'failed',
    failed_at = NOW(),
    error_message = p_error_message,
    error_code = p_error_code,
    retry_count = retry_count + 1,
    updated_at = NOW()
  WHERE id = p_log_id;

  RETURN FOUND;
END;
$$;

-- Function to get email statistics for a user
CREATE OR REPLACE FUNCTION get_user_email_stats(p_user_id UUID)
RETURNS TABLE (
  total_sent INTEGER,
  total_delivered INTEGER,
  total_opened INTEGER,
  total_clicked INTEGER,
  total_failed INTEGER,
  open_rate NUMERIC,
  click_rate NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)::INTEGER as total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered')::INTEGER as total_delivered,
    COUNT(*) FILTER (WHERE status IN ('opened', 'clicked'))::INTEGER as total_opened,
    COUNT(*) FILTER (WHERE status = 'clicked')::INTEGER as total_clicked,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as total_failed,
    ROUND(
      (COUNT(*) FILTER (WHERE status IN ('opened', 'clicked'))::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as open_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'clicked')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as click_rate
  FROM public.email_notifications_log
  WHERE user_id = p_user_id
    AND status != 'pending';
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_email_notification TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_sent TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_delivered TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_opened TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_clicked TO service_role;
GRANT EXECUTE ON FUNCTION mark_email_failed TO service_role;
GRANT EXECUTE ON FUNCTION get_user_email_stats TO authenticated, service_role;

COMMENT ON FUNCTION log_email_notification IS 'Creates a new email log entry when an email is queued';
COMMENT ON FUNCTION mark_email_sent IS 'Marks an email as sent with provider details';
COMMENT ON FUNCTION mark_email_delivered IS 'Marks an email as delivered (webhook from provider)';
COMMENT ON FUNCTION mark_email_opened IS 'Records email open event (webhook from provider)';
COMMENT ON FUNCTION mark_email_clicked IS 'Records email click event (webhook from provider)';
COMMENT ON FUNCTION mark_email_failed IS 'Marks an email as failed with error details';
COMMENT ON FUNCTION get_user_email_stats IS 'Returns email engagement statistics for a user';

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*

-- Log a new email
SELECT log_email_notification(
  auth.uid(),
  'user@example.com',
  'blueprint_complete',
  'Your Blueprint is Ready!',
  'blueprint-ready-v1',
  '{"blueprint_title": "My Learning Path", "blueprint_id": "123"}'::jsonb
);

-- Mark as sent
SELECT mark_email_sent(
  '<log_id>',
  'resend_abc123',
  '{"message_id": "abc123", "queue_time": 0.5}'::jsonb
);

-- Webhook: Mark as delivered
SELECT mark_email_delivered('resend_abc123');

-- Webhook: Mark as opened
SELECT mark_email_opened('resend_abc123');

-- Webhook: Mark as clicked
SELECT mark_email_clicked('resend_abc123');

-- Mark as failed
SELECT mark_email_failed(
  '<log_id>',
  'Recipient email address is invalid',
  'INVALID_EMAIL'
);

-- Get user email statistics
SELECT * FROM get_user_email_stats(auth.uid());

*/
