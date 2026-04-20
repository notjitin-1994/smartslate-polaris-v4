-- Migration: Create Alerts System
-- Description: Creates tables and policies for the admin alerts system
-- Author: System
-- Date: 2025-11-09

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
-- INITIAL SEED DATA (Sample Alerts)
-- ============================================================================

-- Insert sample alerts to populate the system
INSERT INTO public.system_alerts (name, description, severity, type, status, triggered_at, owner_id, affected_resources, metadata)
VALUES
    -- Critical alerts
    (
        'High API Cost Detected',
        'User API costs have exceeded $10 in the last 24 hours. Immediate investigation required.',
        'critical',
        'cost',
        'active',
        NOW() - INTERVAL '2 hours',
        NULL,
        '["user_001", "user_002"]'::jsonb,
        '{"threshold": 1000, "actual": 1250, "currency": "cents"}'::jsonb
    ),
    (
        'Database Connection Pool Exhausted',
        'PostgreSQL connection pool has reached 95% capacity. New connections may be rejected.',
        'critical',
        'database',
        'active',
        NOW() - INTERVAL '45 minutes',
        NULL,
        '["primary_db"]'::jsonb,
        '{"pool_size": 100, "active_connections": 95}'::jsonb
    ),
    (
        'Multiple Failed Authentication Attempts',
        'Detected 15 failed login attempts from IP 192.168.1.100 in the last 10 minutes.',
        'critical',
        'security',
        'acknowledged',
        NOW() - INTERVAL '1 hour',
        NULL,
        '["auth_service"]'::jsonb,
        '{"ip_address": "192.168.1.100", "attempts": 15}'::jsonb
    ),

    -- High priority alerts
    (
        'API Response Time Degradation',
        'Average API response time has increased to 3.5 seconds, exceeding the 2-second threshold.',
        'high',
        'performance',
        'active',
        NOW() - INTERVAL '3 hours',
        NULL,
        '["api_gateway"]'::jsonb,
        '{"avg_response_time_ms": 3500, "threshold_ms": 2000}'::jsonb
    ),
    (
        'Monthly Cost Approaching Limit',
        'Total monthly API costs are at 85% of the allocated budget ($170 of $200).',
        'high',
        'cost',
        'acknowledged',
        NOW() - INTERVAL '5 hours',
        NULL,
        '[]'::jsonb,
        '{"budget_cents": 20000, "spent_cents": 17000, "percentage": 85}'::jsonb
    ),
    (
        'Unusual Traffic Pattern Detected',
        'Traffic from a single IP has increased by 300% in the last hour.',
        'high',
        'security',
        'active',
        NOW() - INTERVAL '30 minutes',
        NULL,
        '["api_gateway"]'::jsonb,
        '{"ip_address": "10.0.0.50", "increase_percentage": 300}'::jsonb
    ),
    (
        'Blueprint Generation Queue Backlog',
        'Blueprint generation queue has 25 pending requests, average wait time is 10 minutes.',
        'high',
        'system',
        'resolved',
        NOW() - INTERVAL '6 hours',
        NULL,
        '["blueprint_service"]'::jsonb,
        '{"queue_depth": 25, "avg_wait_time_seconds": 600}'::jsonb
    ),

    -- Medium priority alerts
    (
        'Disk Space Warning',
        'Database disk usage is at 75%. Consider cleanup or expansion.',
        'medium',
        'database',
        'active',
        NOW() - INTERVAL '8 hours',
        NULL,
        '["primary_db"]'::jsonb,
        '{"total_gb": 100, "used_gb": 75, "percentage": 75}'::jsonb
    ),
    (
        'Cache Hit Rate Below Optimal',
        'Redis cache hit rate has dropped to 65%, below the recommended 80%.',
        'medium',
        'performance',
        'active',
        NOW() - INTERVAL '4 hours',
        NULL,
        '["redis_cache"]'::jsonb,
        '{"hit_rate_percentage": 65, "recommended_percentage": 80}'::jsonb
    ),
    (
        'Inactive Users Approaching Cleanup',
        '150 users have been inactive for 90+ days and are scheduled for archival.',
        'medium',
        'system',
        'muted',
        NOW() - INTERVAL '12 hours',
        NULL,
        '[]'::jsonb,
        '{"inactive_count": 150, "threshold_days": 90}'::jsonb
    ),
    (
        'SSL Certificate Renewal Due',
        'SSL certificate for api.smartslate.com expires in 15 days.',
        'medium',
        'security',
        'acknowledged',
        NOW() - INTERVAL '1 day',
        NULL,
        '["api.smartslate.com"]'::jsonb,
        '{"domain": "api.smartslate.com", "expiry_date": "2025-11-24", "days_remaining": 15}'::jsonb
    ),
    (
        'Error Rate Increase',
        '5% of API requests are returning 500 errors, up from the normal 1%.',
        'medium',
        'api',
        'resolved',
        NOW() - INTERVAL '10 hours',
        NULL,
        '["api_gateway"]'::jsonb,
        '{"error_rate_percentage": 5, "normal_rate_percentage": 1}'::jsonb
    ),

    -- Low priority alerts
    (
        'New Feature Usage Low',
        'The new blueprint export feature has only been used 5 times in the last week.',
        'low',
        'system',
        'active',
        NOW() - INTERVAL '2 days',
        NULL,
        '["blueprint_export"]'::jsonb,
        '{"usage_count": 5, "expected_count": 50}'::jsonb
    ),
    (
        'Outdated Dependencies Detected',
        '3 npm packages have security updates available.',
        'low',
        'security',
        'active',
        NOW() - INTERVAL '3 days',
        NULL,
        '[]'::jsonb,
        '{"outdated_packages": ["axios", "express", "lodash"], "count": 3}'::jsonb
    ),
    (
        'Documentation Views Low',
        'Help documentation has received 40% fewer views this month.',
        'low',
        'system',
        'muted',
        NOW() - INTERVAL '1 day',
        NULL,
        '["documentation"]'::jsonb,
        '{"current_views": 150, "previous_views": 250, "decrease_percentage": 40}'::jsonb
    );

-- Create initial timeline entries for alerts with status changes
INSERT INTO public.alert_timeline (alert_id, action, actor_id, actor_name, timestamp, notes)
SELECT
    id,
    CASE
        WHEN status = 'active' THEN 'created'
        WHEN status = 'acknowledged' THEN 'acknowledged'
        WHEN status = 'resolved' THEN 'resolved'
        WHEN status = 'muted' THEN 'muted'
    END,
    NULL,
    'System',
    triggered_at,
    'Alert generated by automated monitoring system'
FROM public.system_alerts;

-- Add acknowledged timeline entries for acknowledged alerts
INSERT INTO public.alert_timeline (alert_id, action, actor_id, actor_name, timestamp, notes)
SELECT
    id,
    'acknowledged',
    NULL,
    'Admin User',
    triggered_at + INTERVAL '15 minutes',
    'Investigating the issue'
FROM public.system_alerts
WHERE status = 'acknowledged';

-- Add resolved timeline entries for resolved alerts
INSERT INTO public.alert_timeline (alert_id, action, actor_id, actor_name, timestamp, notes)
SELECT
    id,
    'resolved',
    NULL,
    'Admin User',
    triggered_at + INTERVAL '2 hours',
    'Issue has been fixed and verified'
FROM public.system_alerts
WHERE status = 'resolved';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback this migration, run:
-- DROP TRIGGER IF EXISTS trigger_system_alerts_updated_at ON public.system_alerts;
-- DROP FUNCTION IF EXISTS public.update_system_alerts_updated_at();
-- DROP TABLE IF EXISTS public.alert_timeline CASCADE;
-- DROP TABLE IF EXISTS public.system_alerts CASCADE;

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
