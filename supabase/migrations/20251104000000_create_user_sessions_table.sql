-- Migration: Create user sessions tracking table
-- Description: Track user login sessions, duration, and engagement metrics
-- Date: 2025-11-04

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet', 'unknown'
    browser VARCHAR(100),
    os VARCHAR(100),

    -- Session state
    is_active BOOLEAN NOT NULL DEFAULT true,
    session_token VARCHAR(255) UNIQUE,

    -- Engagement metrics
    page_views INTEGER DEFAULT 0,
    actions_count INTEGER DEFAULT 0,
    blueprints_created INTEGER DEFAULT 0,
    blueprints_viewed INTEGER DEFAULT 0,

    -- Computed fields
    duration_seconds INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN ended_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
            ELSE EXTRACT(EPOCH FROM (last_activity_at - started_at))::INTEGER
        END
    ) STORED,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own sessions (handled by middleware)
CREATE POLICY "Users can create own sessions"
    ON public.user_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own active sessions
CREATE POLICY "Users can update own sessions"
    ON public.user_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
    ON public.user_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND user_role IN ('developer', 'enterprise', 'armada', 'fleet')
        )
    );

-- Function to automatically end inactive sessions
CREATE OR REPLACE FUNCTION end_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- End sessions inactive for more than 30 minutes
    UPDATE public.user_sessions
    SET
        is_active = false,
        ended_at = last_activity_at + INTERVAL '30 minutes',
        updated_at = NOW()
    WHERE
        is_active = true
        AND last_activity_at < NOW() - INTERVAL '30 minutes'
        AND ended_at IS NULL;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(
    p_session_id UUID,
    p_page_view BOOLEAN DEFAULT false,
    p_action BOOLEAN DEFAULT false,
    p_blueprint_created BOOLEAN DEFAULT false,
    p_blueprint_viewed BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_sessions
    SET
        last_activity_at = NOW(),
        page_views = page_views + CASE WHEN p_page_view THEN 1 ELSE 0 END,
        actions_count = actions_count + CASE WHEN p_action THEN 1 ELSE 0 END,
        blueprints_created = blueprints_created + CASE WHEN p_blueprint_created THEN 1 ELSE 0 END,
        blueprints_viewed = blueprints_viewed + CASE WHEN p_blueprint_viewed THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE
        id = p_session_id
        AND is_active = true;
END;
$$;

-- Function to get active session for user
CREATE OR REPLACE FUNCTION get_active_session(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    SELECT id INTO v_session_id
    FROM public.user_sessions
    WHERE
        user_id = p_user_id
        AND is_active = true
        AND last_activity_at > NOW() - INTERVAL '30 minutes'
    ORDER BY last_activity_at DESC
    LIMIT 1;

    RETURN v_session_id;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_sessions_timestamp
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Tracks user login sessions with timing and engagement metrics';
COMMENT ON COLUMN public.user_sessions.duration_seconds IS 'Computed session duration in seconds (generated column)';
COMMENT ON COLUMN public.user_sessions.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN public.user_sessions.last_activity_at IS 'Last recorded user activity in this session';
COMMENT ON FUNCTION end_inactive_sessions() IS 'Automatically ends sessions inactive for more than 30 minutes';
COMMENT ON FUNCTION update_session_activity(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) IS 'Updates session activity metrics';
COMMENT ON FUNCTION get_active_session(UUID) IS 'Gets the active session ID for a user, or NULL if none active';
