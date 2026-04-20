-- Migration: Create security audit log for comprehensive tracking
-- Purpose: Implement audit trail for all security-relevant events and limit changes
-- Created: 2025-11-02

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event identification
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN (
    'auth', 'limits', 'webhook', 'tier_change', 'security', 'admin', 'system'
  )),

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,

  -- Security context
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Detailed metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  request_id TEXT, -- For tracing related events

  -- Performance metrics
  duration_ms INTEGER,

  -- Indexes for common queries
  CONSTRAINT check_valid_action CHECK (
    action IN (
      -- Limit events
      'limit_check', 'limit_exceeded', 'limit_reset', 'limit_increment',
      'limit_exemption_granted', 'limit_exemption_revoked',

      -- Webhook events
      'webhook_received', 'webhook_validated', 'webhook_rejected',
      'webhook_signature_invalid', 'webhook_duplicate', 'webhook_processed',

      -- Authentication events
      'auth_attempt', 'auth_success', 'auth_failure', 'auth_logout',
      'auth_token_refresh', 'auth_mfa_required', 'auth_mfa_success',

      -- Permission events
      'permission_denied', 'permission_granted', 'role_changed',

      -- Rate limiting
      'rate_limited', 'rate_limit_exceeded',

      -- Tier management
      'tier_upgraded', 'tier_downgraded', 'tier_configuration_changed',

      -- Blueprint operations
      'blueprint_created', 'blueprint_saved', 'blueprint_generation_started',
      'blueprint_generation_completed', 'blueprint_generation_failed',

      -- System events
      'monthly_reset_executed', 'carryover_applied', 'database_error',
      'concurrent_modification_prevented', 'version_conflict_detected'
    )
  )
);

-- Create indexes for efficient querying
CREATE INDEX idx_security_audit_log_created
  ON public.security_audit_log(created_at DESC);

CREATE INDEX idx_security_audit_log_user
  ON public.security_audit_log(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_security_audit_log_event_type
  ON public.security_audit_log(event_type, created_at DESC);

CREATE INDEX idx_security_audit_log_category
  ON public.security_audit_log(event_category, created_at DESC);

CREATE INDEX idx_security_audit_log_risk
  ON public.security_audit_log(risk_level, created_at DESC)
  WHERE risk_level IS NOT NULL;

CREATE INDEX idx_security_audit_log_failed
  ON public.security_audit_log(success, created_at DESC)
  WHERE success = false;

CREATE INDEX idx_security_audit_log_request_id
  ON public.security_audit_log(request_id)
  WHERE request_id IS NOT NULL;

-- Partial index for high-risk failed events (for security monitoring)
CREATE INDEX idx_security_audit_log_high_risk_failures
  ON public.security_audit_log(created_at DESC)
  WHERE success = false AND risk_level IN ('high', 'critical');

-- Enable RLS - only service role can access audit logs
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- No policies for regular users - audit logs are admin-only
CREATE POLICY "Service role full access to audit logs"
  ON public.security_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_category TEXT,
  p_action TEXT,
  p_success BOOLEAN,
  p_user_id UUID DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_risk_level TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_session_id TEXT;
BEGIN
  -- Try to get session ID from current session
  v_session_id := current_setting('request.session', true);

  -- Insert audit log entry
  INSERT INTO public.security_audit_log (
    event_type,
    event_category,
    action,
    success,
    user_id,
    resource_type,
    resource_id,
    failure_reason,
    risk_level,
    metadata,
    ip_address,
    user_agent,
    session_id,
    request_id,
    duration_ms
  ) VALUES (
    p_event_type,
    p_event_category,
    p_action,
    p_success,
    COALESCE(p_user_id, auth.uid()),
    p_resource_type,
    p_resource_id,
    p_failure_reason,
    p_risk_level,
    p_metadata,
    p_ip_address,
    p_user_agent,
    v_session_id,
    p_request_id,
    p_duration_ms
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log limit events specifically
CREATE OR REPLACE FUNCTION public.log_limit_event(
  p_user_id UUID,
  p_action TEXT, -- 'limit_check', 'limit_exceeded', 'limit_increment', etc.
  p_limit_type TEXT, -- 'creation' or 'saving'
  p_current_count INTEGER,
  p_limit INTEGER,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_risk_level TEXT;
BEGIN
  -- Determine risk level based on action
  IF p_action = 'limit_exceeded' THEN
    v_risk_level := 'medium';
  ELSIF p_action = 'limit_exemption_granted' THEN
    v_risk_level := 'high';
  ELSE
    v_risk_level := 'low';
  END IF;

  -- Log the event
  RETURN log_security_event(
    p_event_type := p_action,
    p_event_category := 'limits',
    p_action := p_action,
    p_success := p_success,
    p_user_id := p_user_id,
    p_resource_type := 'blueprint_limit',
    p_resource_id := p_limit_type,
    p_failure_reason := p_failure_reason,
    p_risk_level := v_risk_level,
    p_metadata := jsonb_build_object(
      'limit_type', p_limit_type,
      'current_count', p_current_count,
      'limit', p_limit,
      'exceeded', p_current_count >= p_limit
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update increment functions to include audit logging
CREATE OR REPLACE FUNCTION public.increment_blueprint_creation_count_v2_with_audit(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  reason TEXT,
  new_count INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_audit_id UUID;
  v_start_time TIMESTAMPTZ;
  v_duration_ms INTEGER;
BEGIN
  v_start_time := clock_timestamp();

  -- Call the original increment function
  SELECT * INTO v_result
  FROM increment_blueprint_creation_count_v2(p_user_id);

  -- Calculate duration
  v_duration_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER;

  -- Log the event
  v_audit_id := log_limit_event(
    p_user_id := p_user_id,
    p_action := CASE
      WHEN v_result.success THEN 'limit_increment'
      WHEN v_result.reason LIKE '%Limit exceeded%' THEN 'limit_exceeded'
      ELSE 'limit_check'
    END,
    p_limit_type := 'creation',
    p_current_count := v_result.new_count,
    p_limit := (
      SELECT creation_limit
      FROM get_tier_limits((SELECT subscription_tier FROM user_profiles WHERE user_id = p_user_id))
    ),
    p_success := v_result.success,
    p_failure_reason := CASE WHEN NOT v_result.success THEN v_result.reason ELSE NULL END
  );

  -- Update the metadata with duration
  UPDATE security_audit_log
  SET duration_ms = v_duration_ms
  WHERE id = v_audit_id;

  RETURN QUERY SELECT v_result.success, v_result.reason, v_result.new_count;
END;
$$ LANGUAGE plpgsql;

-- View for security monitoring dashboard
CREATE OR REPLACE VIEW public.security_audit_summary AS
WITH recent_events AS (
  SELECT *
  FROM security_audit_log
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT
  event_category,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE success = true) AS successful_events,
  COUNT(*) FILTER (WHERE success = false) AS failed_events,
  COUNT(*) FILTER (WHERE risk_level = 'high' OR risk_level = 'critical') AS high_risk_events,
  AVG(duration_ms) AS avg_duration_ms,
  MAX(created_at) AS last_event_at
FROM recent_events
GROUP BY event_category;

-- Grant read access to the summary view for authenticated users (admin dashboard)
GRANT SELECT ON public.security_audit_summary TO authenticated;

-- Function to clean up old audit logs (keep 90 days by default)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete old audit logs
  DELETE FROM security_audit_log
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND risk_level NOT IN ('high', 'critical'); -- Keep high-risk events longer

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup operation
  PERFORM log_security_event(
    p_event_type := 'audit_cleanup',
    p_event_category := 'system',
    p_action := 'audit_cleanup',
    p_success := true,
    p_metadata := jsonb_build_object(
      'deleted_count', v_deleted_count,
      'retention_days', p_retention_days
    )
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.security_audit_log IS 'Comprehensive security audit trail for all security-relevant events, limit changes, and system operations';
COMMENT ON COLUMN public.security_audit_log.event_category IS 'High-level category: auth, limits, webhook, tier_change, security, admin, system';
COMMENT ON COLUMN public.security_audit_log.risk_level IS 'Risk assessment: low, medium, high, critical - used for security monitoring';
COMMENT ON FUNCTION public.log_security_event IS 'Generic function to log any security-relevant event to the audit trail';
COMMENT ON FUNCTION public.log_limit_event IS 'Specialized function for logging blueprint limit-related events';
COMMENT ON VIEW public.security_audit_summary IS 'Dashboard view showing 24-hour summary of security events by category';