-- Migration: Create session_tracking table
-- Description: Track user sessions for security and session management
-- Author: SmartSlate Team
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- CREATE SESSION_TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_tracking (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session information
  session_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Location info (optional, from IP geolocation)
  location_city TEXT,
  location_country TEXT,
  location_coordinates POINT,

  -- Session lifecycle
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Security metadata
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  security_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying by user_id
CREATE INDEX IF NOT EXISTS idx_session_tracking_user_id
  ON public.session_tracking(user_id);

-- Index for active sessions query
-- Note: We can't use NOW() in a partial index, so we just index by is_active status
CREATE INDEX IF NOT EXISTS idx_session_tracking_active
  ON public.session_tracking(user_id, is_active, expires_at)
  WHERE is_active = true;

-- Index for session token lookups
CREATE INDEX IF NOT EXISTS idx_session_tracking_token
  ON public.session_tracking(session_token);

-- Index for last activity (cleanup queries)
CREATE INDEX IF NOT EXISTS idx_session_tracking_activity
  ON public.session_tracking(last_activity_at DESC);

-- Index for suspicious sessions
CREATE INDEX IF NOT EXISTS idx_session_tracking_suspicious
  ON public.session_tracking(user_id)
  WHERE is_suspicious = true;

-- GIN indexes for JSONB searches
CREATE INDEX IF NOT EXISTS idx_session_tracking_device_info
  ON public.session_tracking USING GIN (device_info);

CREATE INDEX IF NOT EXISTS idx_session_tracking_security_metadata
  ON public.session_tracking USING GIN (security_metadata);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.session_tracking IS 'Tracks user sessions for security monitoring and session management';
COMMENT ON COLUMN public.session_tracking.id IS 'Unique identifier for the session';
COMMENT ON COLUMN public.session_tracking.user_id IS 'User who owns this session';
COMMENT ON COLUMN public.session_tracking.session_token IS 'Session token (hashed or reference to Supabase auth session)';
COMMENT ON COLUMN public.session_tracking.device_info IS 'Device information (browser, OS, device type, screen resolution)';
COMMENT ON COLUMN public.session_tracking.ip_address IS 'IP address from which session was created';
COMMENT ON COLUMN public.session_tracking.user_agent IS 'User agent string';
COMMENT ON COLUMN public.session_tracking.location_city IS 'City derived from IP geolocation';
COMMENT ON COLUMN public.session_tracking.location_country IS 'Country derived from IP geolocation';
COMMENT ON COLUMN public.session_tracking.location_coordinates IS 'Geographic coordinates (lat, lon)';
COMMENT ON COLUMN public.session_tracking.last_activity_at IS 'Last time this session was active';
COMMENT ON COLUMN public.session_tracking.expires_at IS 'When this session expires';
COMMENT ON COLUMN public.session_tracking.ended_at IS 'When this session was ended (if manually terminated)';
COMMENT ON COLUMN public.session_tracking.is_suspicious IS 'Flag for suspicious activity detection';
COMMENT ON COLUMN public.session_tracking.security_metadata IS 'Additional security-related metadata';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.session_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.session_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own sessions
CREATE POLICY "Users can create own sessions"
  ON public.session_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions (for revocation)
CREATE POLICY "Users can update own sessions"
  ON public.session_tracking FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.session_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all sessions
CREATE POLICY "Service role can manage all sessions"
  ON public.session_tracking FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.session_tracking FOR SELECT
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

CREATE OR REPLACE FUNCTION update_session_tracking_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_session_tracking_updated_at
  BEFORE UPDATE ON public.session_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_session_tracking_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active sessions for a user
CREATE OR REPLACE FUNCTION get_active_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  device_info JSONB,
  ip_address INET,
  location_city TEXT,
  location_country TEXT,
  is_current BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    st.id,
    st.created_at,
    st.last_activity_at,
    st.device_info,
    st.ip_address,
    st.location_city,
    st.location_country,
    st.session_token = (SELECT session_token FROM public.session_tracking WHERE user_id = p_user_id ORDER BY last_activity_at DESC LIMIT 1) as is_current
  FROM public.session_tracking st
  WHERE st.user_id = p_user_id
    AND st.is_active = true
    AND st.expires_at > NOW()
  ORDER BY st.last_activity_at DESC;
$$;

-- Function to revoke all sessions except current
CREATE OR REPLACE FUNCTION revoke_all_other_sessions(p_user_id UUID, p_current_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  UPDATE public.session_tracking
  SET
    is_active = false,
    ended_at = NOW()
  WHERE user_id = p_user_id
    AND id != p_current_session_id
    AND is_active = true
    AND expires_at > NOW();

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

  -- Log the revocation
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    metadata
  )
  VALUES (
    p_user_id,
    p_user_id,
    'sessions_revoked',
    'security',
    jsonb_build_object(
      'revoked_count', v_revoked_count,
      'kept_session_id', p_current_session_id
    )
  );

  RETURN v_revoked_count;
END;
$$;

-- Function to clean up expired sessions (for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.session_tracking
  WHERE expires_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_all_other_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO service_role;

COMMENT ON FUNCTION get_active_sessions IS 'Returns all active (non-revoked, non-expired) sessions for a user';
COMMENT ON FUNCTION revoke_all_other_sessions IS 'Revokes all sessions except the specified one';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes sessions expired more than 30 days ago (for cron job)';

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*

-- Get active sessions
SELECT * FROM get_active_sessions(auth.uid());

-- Revoke all other sessions
SELECT revoke_all_other_sessions(auth.uid(), '<current_session_id>');

-- Manual cleanup (admin only)
SELECT cleanup_expired_sessions();

*/
