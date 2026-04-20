-- Migration: Implement scheduled monthly limit resets
-- Purpose: Replace on-demand resets with scheduled, automated monthly resets
-- Created: 2025-11-02

-- Function to reset monthly limits for all eligible users (called by cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_limits_scheduled()
RETURNS TABLE(
  users_processed INTEGER,
  users_reset INTEGER,
  execution_time_ms BIGINT,
  errors_count INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_users_processed INTEGER := 0;
  v_users_reset INTEGER := 0;
  v_errors_count INTEGER := 0;
  v_user RECORD;
  v_audit_id UUID;
BEGIN
  v_start_time := clock_timestamp();

  -- Log start of reset operation
  v_audit_id := log_security_event(
    p_event_type := 'monthly_reset_started',
    p_event_category := 'system',
    p_action := 'monthly_reset_executed',
    p_success := true,
    p_metadata := jsonb_build_object(
      'started_at', v_start_time
    )
  );

  -- Process users in batches to avoid long-running transactions
  FOR v_user IN
    SELECT
      up.user_id,
      up.subscription_tier,
      up.blueprint_creation_count,
      up.blueprint_saving_count,
      (up.blueprint_usage_metadata->>'last_reset')::timestamptz AS last_reset
    FROM user_profiles up
    WHERE
      -- Only reset non-free tiers (paid tiers have monthly rollover)
      up.subscription_tier NOT IN ('explorer', 'enterprise', 'developer')
      -- Don't reset exempt users
      AND COALESCE((up.blueprint_usage_metadata->>'exempt_from_limits')::boolean, false) = false
      -- Reset if last reset was more than 30 days ago or never reset
      AND (
        (up.blueprint_usage_metadata->>'last_reset')::timestamptz < (NOW() - INTERVAL '30 days')
        OR up.blueprint_usage_metadata->>'last_reset' IS NULL
        OR DATE_PART('month', NOW()) != DATE_PART('month', (up.blueprint_usage_metadata->>'last_reset')::timestamptz)
      )
  LOOP
    v_users_processed := v_users_processed + 1;

    BEGIN
      -- Reset limits for this user
      UPDATE user_profiles
      SET
        blueprint_creation_count = 0,
        blueprint_saving_count = 0,
        blueprint_usage_metadata = jsonb_set(
          COALESCE(blueprint_usage_metadata, '{}'::jsonb),
          '{last_reset}',
          to_jsonb(NOW())
        ) || jsonb_build_object(
          'prev_creation_count', v_user.blueprint_creation_count,
          'prev_saving_count', v_user.blueprint_saving_count,
          'reset_from', v_user.last_reset
        ),
        updated_at = NOW()
      WHERE user_id = v_user.user_id
        -- Double-check counts haven't changed (optimistic check)
        AND blueprint_creation_count = v_user.blueprint_creation_count
        AND blueprint_saving_count = v_user.blueprint_saving_count;

      IF FOUND THEN
        v_users_reset := v_users_reset + 1;

        -- Log individual user reset
        PERFORM log_limit_event(
          p_user_id := v_user.user_id,
          p_action := 'limit_reset',
          p_limit_type := 'both',
          p_current_count := 0,
          p_limit := 0,
          p_success := true
        );
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other users
      v_errors_count := v_errors_count + 1;

      PERFORM log_security_event(
        p_event_type := 'monthly_reset_error',
        p_event_category := 'system',
        p_action := 'monthly_reset_executed',
        p_success := false,
        p_user_id := v_user.user_id,
        p_failure_reason := SQLERRM,
        p_risk_level := 'medium',
        p_metadata := jsonb_build_object(
          'user_tier', v_user.subscription_tier,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;

  v_end_time := clock_timestamp();

  -- Log completion of reset operation
  UPDATE security_audit_log
  SET
    metadata = metadata || jsonb_build_object(
      'completed_at', v_end_time,
      'users_processed', v_users_processed,
      'users_reset', v_users_reset,
      'errors_count', v_errors_count,
      'execution_time_ms', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::BIGINT
    ),
    duration_ms = EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INTEGER
  WHERE id = v_audit_id;

  RETURN QUERY SELECT
    v_users_processed,
    v_users_reset,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::BIGINT,
    v_errors_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user needs reset (helper function)
CREATE OR REPLACE FUNCTION public.user_needs_monthly_reset(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_tier TEXT;
  v_last_reset TIMESTAMPTZ;
  v_is_exempt BOOLEAN;
BEGIN
  SELECT
    subscription_tier,
    (blueprint_usage_metadata->>'last_reset')::timestamptz,
    COALESCE((blueprint_usage_metadata->>'exempt_from_limits')::boolean, false)
  INTO v_tier, v_last_reset, v_is_exempt
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Free tier doesn't reset (lifetime limits)
  IF v_tier = 'explorer' THEN
    RETURN false;
  END IF;

  -- Unlimited tiers don't need reset
  IF v_tier IN ('enterprise', 'developer') THEN
    RETURN false;
  END IF;

  -- Exempt users don't reset
  IF v_is_exempt THEN
    RETURN false;
  END IF;

  -- Check if it's been more than 30 days since last reset
  IF v_last_reset IS NULL THEN
    RETURN true; -- Never reset before
  END IF;

  -- Check if we're in a new month
  IF DATE_PART('month', NOW()) != DATE_PART('month', v_last_reset) THEN
    RETURN true;
  END IF;

  -- Check if it's been more than 30 days
  IF v_last_reset < (NOW() - INTERVAL '30 days') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger reset for a specific user (admin function)
CREATE OR REPLACE FUNCTION public.reset_user_limits_manual(
  p_user_id UUID,
  p_admin_reason TEXT DEFAULT 'Manual reset by admin'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_creation_count INTEGER;
  v_old_saving_count INTEGER;
  v_tier TEXT;
BEGIN
  -- Get current counts
  SELECT
    blueprint_creation_count,
    blueprint_saving_count,
    subscription_tier
  INTO v_old_creation_count, v_old_saving_count, v_tier
  FROM user_profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Reset the counts
  UPDATE user_profiles
  SET
    blueprint_creation_count = 0,
    blueprint_saving_count = 0,
    blueprint_usage_metadata = jsonb_set(
      COALESCE(blueprint_usage_metadata, '{}'::jsonb),
      '{last_reset}',
      to_jsonb(NOW())
    ) || jsonb_build_object(
      'manual_reset', true,
      'reset_reason', p_admin_reason,
      'reset_by', auth.uid(),
      'prev_creation_count', v_old_creation_count,
      'prev_saving_count', v_old_saving_count
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the manual reset
  PERFORM log_security_event(
    p_event_type := 'manual_limit_reset',
    p_event_category := 'admin',
    p_action := 'limit_reset',
    p_success := true,
    p_user_id := p_user_id,
    p_risk_level := 'medium',
    p_metadata := jsonb_build_object(
      'admin_id', auth.uid(),
      'reason', p_admin_reason,
      'old_creation_count', v_old_creation_count,
      'old_saving_count', v_old_saving_count,
      'user_tier', v_tier
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create a table to track cron job executions
CREATE TABLE IF NOT EXISTS public.cron_job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  success BOOLEAN,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',

  CONSTRAINT check_valid_job_name CHECK (
    job_name IN ('monthly_limit_reset', 'audit_log_cleanup', 'usage_sync')
  )
);

-- Index for querying recent job history
CREATE INDEX idx_cron_job_history_recent
  ON public.cron_job_history(job_name, started_at DESC);

-- Function to record cron job execution
CREATE OR REPLACE FUNCTION public.record_cron_execution(
  p_job_name TEXT,
  p_success BOOLEAN,
  p_metadata JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO public.cron_job_history (
    job_name,
    completed_at,
    success,
    error_message,
    metadata
  ) VALUES (
    p_job_name,
    NOW(),
    p_success,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Main cron job wrapper function
CREATE OR REPLACE FUNCTION public.execute_monthly_reset_cron()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_job_id UUID;
  v_response JSONB;
BEGIN
  -- Check if reset already ran today
  IF EXISTS (
    SELECT 1
    FROM cron_job_history
    WHERE job_name = 'monthly_limit_reset'
      AND success = true
      AND started_at::date = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Monthly reset already executed today',
      'timestamp', NOW()
    );
  END IF;

  -- Execute the reset
  SELECT * INTO v_result
  FROM reset_monthly_limits_scheduled();

  -- Record the execution
  v_job_id := record_cron_execution(
    p_job_name := 'monthly_limit_reset',
    p_success := (v_result.errors_count = 0),
    p_metadata := jsonb_build_object(
      'users_processed', v_result.users_processed,
      'users_reset', v_result.users_reset,
      'execution_time_ms', v_result.execution_time_ms,
      'errors_count', v_result.errors_count
    ),
    p_error_message := CASE
      WHEN v_result.errors_count > 0
      THEN format('%s errors occurred during reset', v_result.errors_count)
      ELSE NULL
    END
  );

  -- Build response
  v_response := jsonb_build_object(
    'success', (v_result.errors_count = 0),
    'job_id', v_job_id,
    'users_processed', v_result.users_processed,
    'users_reset', v_result.users_reset,
    'execution_time_ms', v_result.execution_time_ms,
    'errors_count', v_result.errors_count,
    'timestamp', NOW()
  );

  RETURN v_response;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission for Edge Function service role
GRANT EXECUTE ON FUNCTION public.execute_monthly_reset_cron TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_monthly_limits_scheduled TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.reset_monthly_limits_scheduled IS 'Main function to reset monthly limits for all eligible users. Called by scheduled cron job.';
COMMENT ON FUNCTION public.user_needs_monthly_reset IS 'Helper function to check if a specific user needs their monthly limits reset.';
COMMENT ON FUNCTION public.reset_user_limits_manual IS 'Admin function to manually reset a user''s limits with audit logging.';
COMMENT ON FUNCTION public.execute_monthly_reset_cron IS 'Wrapper function for cron job execution with deduplication and history tracking.';
COMMENT ON TABLE public.cron_job_history IS 'History of scheduled job executions for monitoring and debugging.';