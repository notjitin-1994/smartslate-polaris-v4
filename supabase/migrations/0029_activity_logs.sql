-- Migration: Activity Logs System
-- Description: Creates activity_logs table for comprehensive admin action auditing
-- Author: SmartSlate Team
-- Date: 2025-11-04

-- ============================================================================
-- CREATE ACTIVITY_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User references
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- User affected by the action
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Admin who performed the action

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'user_created',
    'user_updated',
    'user_deleted',
    'user_role_changed',
    'user_tier_changed',
    'user_limits_updated',
    'bulk_role_update',
    'bulk_tier_update',
    'bulk_delete',
    'user_login',
    'user_logout',
    'user_password_reset',
    'user_email_changed',
    'data_export',
    'system_config_change',
    'blueprint_created',
    'blueprint_deleted',
    'blueprint_shared'
  )),

  -- Resource identification
  resource_type TEXT CHECK (resource_type IN ('user', 'blueprint', 'system', 'export')),
  resource_id TEXT,  -- Can be user_id, blueprint_id, or other resource identifier

  -- Additional context stored as JSONB for flexibility
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Network information
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for queries by user_id (e.g., "show me all activities for user X")
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs(user_id)
  WHERE user_id IS NOT NULL;

-- Index for queries by actor_id (e.g., "show me all actions performed by admin Y")
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id
  ON activity_logs(actor_id)
  WHERE actor_id IS NOT NULL;

-- Index for time-based queries (most recent activities)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs(created_at DESC);

-- Composite index for user activity timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
  ON activity_logs(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type
  ON activity_logs(action_type);

-- Index for resource lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource
  ON activity_logs(resource_type, resource_id)
  WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- GIN index for JSONB metadata searches (enables fast searches within metadata)
CREATE INDEX IF NOT EXISTS idx_activity_logs_metadata_gin
  ON activity_logs USING GIN (metadata);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE activity_logs IS 'Comprehensive audit log for all admin and user activities in the system';
COMMENT ON COLUMN activity_logs.id IS 'Unique identifier for each activity log entry';
COMMENT ON COLUMN activity_logs.user_id IS 'ID of the user affected by the action (subject)';
COMMENT ON COLUMN activity_logs.actor_id IS 'ID of the admin user who performed the action';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action performed (constrained by CHECK)';
COMMENT ON COLUMN activity_logs.resource_type IS 'Type of resource affected (user, blueprint, system, export)';
COMMENT ON COLUMN activity_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN activity_logs.metadata IS 'Flexible JSONB field for storing action-specific context (before/after values, counts, etc.)';
COMMENT ON COLUMN activity_logs.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN activity_logs.user_agent IS 'Browser user agent string of the actor';
COMMENT ON COLUMN activity_logs.created_at IS 'Timestamp when the activity occurred';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on activity_logs table
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins and developers can view all activity logs
CREATE POLICY "Admin and developers can view all activity logs"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'developer')
    )
  );

-- Policy 2: Only admins and developers can insert activity logs (via API)
CREATE POLICY "Admin and developers can insert activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('admin', 'developer')
    )
  );

-- Policy 3: Activity logs are immutable - no updates or deletes
-- (No UPDATE or DELETE policies means these operations are blocked)

-- ============================================================================
-- HELPER FUNCTION: Log Activity
-- ============================================================================

CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_actor_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Insert activity log
  INSERT INTO activity_logs (
    user_id,
    actor_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_actor_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

COMMENT ON FUNCTION log_activity IS 'Helper function to create activity log entries with proper validation';

-- ============================================================================
-- DATA RETENTION POLICY (OPTIONAL - UNCOMMENT IF NEEDED)
-- ============================================================================

-- Automatically delete activity logs older than 1 year (365 days)
-- Uncomment below to enable automatic cleanup
/*
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '365 days';
END;
$$;

-- Schedule the cleanup to run daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-activity-logs', '0 2 * * *', 'SELECT cleanup_old_activity_logs()');
*/

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage to authenticated users (RLS policies will control actual access)
GRANT SELECT, INSERT ON activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;

-- ============================================================================
-- ROLLBACK MIGRATION (FOR REFERENCE)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP FUNCTION IF EXISTS cleanup_old_activity_logs();
DROP FUNCTION IF EXISTS log_activity(UUID, UUID, TEXT, TEXT, TEXT, JSONB, INET, TEXT);
DROP TABLE IF EXISTS activity_logs CASCADE;

-- Also remove any scheduled cron jobs:
-- SELECT cron.unschedule('cleanup-activity-logs');
*/
