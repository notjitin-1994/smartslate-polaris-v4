-- Migration: Create Alerts System (Clean - No Sample Data)
-- Description: Creates tables and policies for the admin alerts system
-- Author: System
-- Date: 2025-11-09

-- First, clean up if previous migration was applied
DO $$
BEGIN
    -- Drop trigger if exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_system_alerts_updated_at') THEN
        DROP TRIGGER trigger_system_alerts_updated_at ON public.system_alerts;
    END IF;

    -- Drop function if exists
    DROP FUNCTION IF EXISTS public.update_system_alerts_updated_at();

    -- Drop tables if they exist
    DROP TABLE IF EXISTS public.alert_timeline CASCADE;
    DROP TABLE IF EXISTS public.system_alerts CASCADE;
END$$;

-- ============================================================================
-- SYSTEM ALERTS TABLE
-- ============================================================================

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    type TEXT NOT NULL CHECK (type IN ('system', 'security', 'performance', 'cost', 'database', 'api')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'muted')),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    affected_resources JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON public.system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON public.system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_triggered_at ON public.system_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_owner_id ON public.system_alerts(owner_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_system_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_alerts_updated_at
    BEFORE UPDATE ON public.system_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_system_alerts_updated_at();

-- ============================================================================
-- ALERT TIMELINE TABLE
-- ============================================================================

-- Create alert_timeline table
CREATE TABLE IF NOT EXISTS public.alert_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.system_alerts(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'acknowledged', 'resolved', 'muted', 'unmuted', 'updated')),
    actor_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_timeline_alert_id ON public.alert_timeline(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_timeline_timestamp ON public.alert_timeline(timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_timeline ENABLE ROW LEVEL SECURITY;

-- Policy: Only developers can read system_alerts
CREATE POLICY "Developers can read all alerts"
    ON public.system_alerts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role = 'developer'
        )
    );

-- Policy: Only developers can insert system_alerts
CREATE POLICY "Developers can insert alerts"
    ON public.system_alerts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role = 'developer'
        )
    );

-- Policy: Only developers can update system_alerts
CREATE POLICY "Developers can update alerts"
    ON public.system_alerts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role = 'developer'
        )
    );

-- Policy: Only developers can delete system_alerts
CREATE POLICY "Developers can delete alerts"
    ON public.system_alerts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role = 'developer'
        )
    );

-- Policy: Only developers can read alert_timeline
CREATE POLICY "Developers can read all timeline entries"
    ON public.alert_timeline
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role = 'developer'
        )
    );

-- Policy: Only developers can insert alert_timeline
CREATE POLICY "Developers can insert timeline entries"
    ON public.alert_timeline
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role = 'developer'
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.system_alerts IS 'Stores system-generated and user-configured alerts for admin monitoring';
COMMENT ON TABLE public.alert_timeline IS 'Audit trail of all status changes for system alerts';
COMMENT ON COLUMN public.system_alerts.severity IS 'Alert severity level: critical (urgent), high (important), medium (moderate), low (informational)';
COMMENT ON COLUMN public.system_alerts.type IS 'Alert category: system, security, performance, cost, database, api';
COMMENT ON COLUMN public.system_alerts.status IS 'Current alert state: active (needs attention), acknowledged (being worked on), resolved (fixed), muted (ignored)';
COMMENT ON COLUMN public.system_alerts.affected_resources IS 'JSON array of resource identifiers affected by this alert';
COMMENT ON COLUMN public.system_alerts.metadata IS 'Additional context and metrics related to the alert';
