-- Migration: Create account_deletion_requests table
-- Description: Manages account deletion requests with 30-day grace period
-- Author: SmartSlate Team
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- CREATE ACCOUNT_DELETION_REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,

  -- User-provided reason (optional)
  reason TEXT,

  -- Additional feedback (JSONB for flexibility)
  feedback JSONB DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'cancelled', 'completed', 'failed')),

  -- Cancellation info
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,

  -- Completion info
  completed_at TIMESTAMPTZ,
  completion_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partial unique index for active (pending) deletion requests
-- Only one pending request allowed per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_deletion_per_user
  ON public.account_deletion_requests (user_id)
  WHERE status = 'pending';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying by user_id
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id
  ON public.account_deletion_requests(user_id);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
  ON public.account_deletion_requests(status);

-- Index for finding requests ready for deletion (scheduled_deletion_at <= NOW())
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_scheduled
  ON public.account_deletion_requests(scheduled_deletion_at)
  WHERE status = 'pending';

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_created_at
  ON public.account_deletion_requests(created_at DESC);

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_feedback
  ON public.account_deletion_requests USING GIN (feedback);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_completion_metadata
  ON public.account_deletion_requests USING GIN (completion_metadata);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.account_deletion_requests IS 'Tracks account deletion requests with 30-day grace period for GDPR compliance';
COMMENT ON COLUMN public.account_deletion_requests.id IS 'Unique identifier for the deletion request';
COMMENT ON COLUMN public.account_deletion_requests.user_id IS 'User who requested account deletion';
COMMENT ON COLUMN public.account_deletion_requests.requested_at IS 'When the deletion was requested';
COMMENT ON COLUMN public.account_deletion_requests.scheduled_deletion_at IS 'When the account is scheduled to be permanently deleted (typically 30 days after request)';
COMMENT ON COLUMN public.account_deletion_requests.reason IS 'User-provided reason for account deletion';
COMMENT ON COLUMN public.account_deletion_requests.feedback IS 'Additional feedback or context about the deletion request';
COMMENT ON COLUMN public.account_deletion_requests.status IS 'Current status: pending, cancelled, completed, or failed';
COMMENT ON COLUMN public.account_deletion_requests.cancelled_at IS 'When the deletion request was cancelled (if applicable)';
COMMENT ON COLUMN public.account_deletion_requests.cancelled_by IS 'User ID who cancelled the request (usually the same user)';
COMMENT ON COLUMN public.account_deletion_requests.cancellation_reason IS 'Reason provided for cancelling the deletion';
COMMENT ON COLUMN public.account_deletion_requests.completed_at IS 'When the deletion was actually completed';
COMMENT ON COLUMN public.account_deletion_requests.completion_metadata IS 'Details about the deletion process (what was deleted, any errors, etc.)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
  ON public.account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own deletion requests
CREATE POLICY "Users can create own deletion requests"
  ON public.account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending deletion requests (for cancellation)
CREATE POLICY "Users can update own pending deletion requests"
  ON public.account_deletion_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all deletion requests
CREATE POLICY "Service role can manage all deletion requests"
  ON public.account_deletion_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
  ON public.account_deletion_requests FOR SELECT
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

CREATE OR REPLACE FUNCTION update_account_deletion_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_account_deletion_requests_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to request account deletion (with 30-day grace period)
CREATE OR REPLACE FUNCTION request_account_deletion(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_feedback JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_scheduled_deletion_at TIMESTAMPTZ;
BEGIN
  -- Calculate scheduled deletion date (30 days from now)
  v_scheduled_deletion_at := NOW() + INTERVAL '30 days';

  -- Insert deletion request
  INSERT INTO public.account_deletion_requests (
    user_id,
    requested_at,
    scheduled_deletion_at,
    reason,
    feedback,
    status
  )
  VALUES (
    p_user_id,
    NOW(),
    v_scheduled_deletion_at,
    p_reason,
    p_feedback,
    'pending'
  )
  RETURNING id INTO v_request_id;

  -- Log activity
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_user_id,
    'user_deleted',
    'user',
    p_user_id::text,
    jsonb_build_object(
      'deletion_request_id', v_request_id,
      'scheduled_deletion_at', v_scheduled_deletion_at,
      'grace_period_days', 30,
      'reason', p_reason
    )
  );

  RETURN v_request_id;
END;
$$;

-- Function to cancel account deletion request
CREATE OR REPLACE FUNCTION cancel_account_deletion(
  p_user_id UUID,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Find the pending deletion request
  SELECT id INTO v_request_id
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no pending request found, return false
  IF v_request_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update the request to cancelled
  UPDATE public.account_deletion_requests
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_user_id,
    cancellation_reason = p_cancellation_reason,
    updated_at = NOW()
  WHERE id = v_request_id;

  -- Log the cancellation
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_user_id,
    'user_updated',
    'user',
    p_user_id::text,
    jsonb_build_object(
      'deletion_request_cancelled', true,
      'deletion_request_id', v_request_id,
      'cancellation_reason', p_cancellation_reason
    )
  );

  RETURN TRUE;
END;
$$;

-- Function to get pending deletions ready to process (for cron job)
CREATE OR REPLACE FUNCTION get_deletions_ready_to_process()
RETURNS TABLE (
  request_id UUID,
  user_id UUID,
  user_email TEXT,
  requested_at TIMESTAMPTZ,
  scheduled_deletion_at TIMESTAMPTZ,
  days_remaining INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    adr.id as request_id,
    adr.user_id,
    u.email as user_email,
    adr.requested_at,
    adr.scheduled_deletion_at,
    EXTRACT(DAY FROM (adr.scheduled_deletion_at - NOW()))::INTEGER as days_remaining
  FROM public.account_deletion_requests adr
  JOIN auth.users u ON u.id = adr.user_id
  WHERE adr.status = 'pending'
    AND adr.scheduled_deletion_at <= NOW()
  ORDER BY adr.scheduled_deletion_at ASC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION request_account_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_account_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION get_deletions_ready_to_process TO service_role;

COMMENT ON FUNCTION request_account_deletion IS 'Creates a new account deletion request with 30-day grace period';
COMMENT ON FUNCTION cancel_account_deletion IS 'Cancels a pending account deletion request';
COMMENT ON FUNCTION get_deletions_ready_to_process IS 'Returns list of deletion requests ready to be processed (scheduled_deletion_at <= NOW())';

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*

-- Request account deletion
SELECT request_account_deletion(
  auth.uid(),
  'No longer need the service',
  '{"feedback_rating": 3, "will_recommend": false}'::jsonb
);

-- Cancel account deletion
SELECT cancel_account_deletion(
  auth.uid(),
  'Changed my mind'
);

-- Check if user has pending deletion request
SELECT *
FROM public.account_deletion_requests
WHERE user_id = auth.uid()
  AND status = 'pending';

-- Get deletions ready to process (admin/cron only)
SELECT * FROM get_deletions_ready_to_process();

*/
