-- Migration: System Logs Table
-- Description: Creates system_logs table for application logging (errors, API calls, performance)
-- Author: SmartSlate Team
-- Date: 2025-11-09
-- Note: This is separate from activity_logs (user actions) - this tracks system events

-- ============================================================================
-- CREATE SYSTEM_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_logs (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core log fields
  timestamp TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  service TEXT NOT NULL CHECK (service IN (
    'claude',
    'ollama',
    'dynamic-questions',
    'database',
    'auth',
    'validation',
    'api',
    'ui',
    'system',
    'feedback',
    'blueprint-generation',
    'claude-client',
    'claude-client-tracked',
    'claude-validation',
    'claude-fallback'
  )),
  event TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Flexible metadata storage
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Context references (optional)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blueprint_id UUID,  -- No FK to allow orphaned logs
  session_id TEXT,
  request_id TEXT,

  -- Performance tracking
  duration_ms INTEGER,

  -- Error details (separate from metadata for easier querying)
  error_stack TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for time-based queries (most common - newest first)
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp
  ON system_logs(timestamp DESC);

-- Index for filtering by log level
CREATE INDEX IF NOT EXISTS idx_system_logs_level
  ON system_logs(level);

-- Index for filtering by service
CREATE INDEX IF NOT EXISTS idx_system_logs_service
  ON system_logs(service);

-- Index for filtering by event
CREATE INDEX IF NOT EXISTS idx_system_logs_event
  ON system_logs(event);

-- Composite index for error queries (common use case)
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp
  ON system_logs(level, timestamp DESC);

-- Composite index for service queries with time
CREATE INDEX IF NOT EXISTS idx_system_logs_service_timestamp
  ON system_logs(service, timestamp DESC);

-- Index for user-specific log queries
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id
  ON system_logs(user_id)
  WHERE user_id IS NOT NULL;

-- Index for blueprint-specific log queries
CREATE INDEX IF NOT EXISTS idx_system_logs_blueprint_id
  ON system_logs(blueprint_id)
  WHERE blueprint_id IS NOT NULL;

-- GIN index for JSONB metadata searches
CREATE INDEX IF NOT EXISTS idx_system_logs_metadata_gin
  ON system_logs USING GIN (metadata);

-- Index for created_at (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at
  ON system_logs(created_at);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE system_logs IS 'Application system logs for errors, API calls, performance monitoring, and debugging';
COMMENT ON COLUMN system_logs.id IS 'Unique identifier for each log entry';
COMMENT ON COLUMN system_logs.timestamp IS 'When the log event occurred';
COMMENT ON COLUMN system_logs.level IS 'Log severity level (debug, info, warn, error)';
COMMENT ON COLUMN system_logs.service IS 'Service/component that generated the log';
COMMENT ON COLUMN system_logs.event IS 'Specific event type (e.g., claude.request, database.query.failure)';
COMMENT ON COLUMN system_logs.message IS 'Human-readable log message';
COMMENT ON COLUMN system_logs.metadata IS 'Flexible JSONB field for additional context (tokens, duration, etc.)';
COMMENT ON COLUMN system_logs.user_id IS 'Optional reference to user context';
COMMENT ON COLUMN system_logs.blueprint_id IS 'Optional reference to blueprint context';
COMMENT ON COLUMN system_logs.session_id IS 'Session identifier for request correlation';
COMMENT ON COLUMN system_logs.request_id IS 'Request identifier for distributed tracing';
COMMENT ON COLUMN system_logs.duration_ms IS 'Operation duration in milliseconds (for performance tracking)';
COMMENT ON COLUMN system_logs.error_stack IS 'Error stack trace (for error-level logs)';
COMMENT ON COLUMN system_logs.created_at IS 'Timestamp when log was created in database';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on system_logs table
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins and developers can view all system logs
CREATE POLICY "Admins and developers can view all system logs"
  ON system_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role = 'developer'
    )
  );

-- Policy 2: Service role can insert system logs (server-side only)
-- Note: This policy allows inserts when using service role key
CREATE POLICY "Service role can insert system logs"
  ON system_logs
  FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS, this is just documentation

-- Policy 3: System logs are immutable - no updates or deletes via RLS
-- (No UPDATE or DELETE policies means these operations are blocked for regular users)

-- ============================================================================
-- HELPER FUNCTION: Bulk Insert System Logs
-- ============================================================================

CREATE OR REPLACE FUNCTION insert_system_logs_batch(
  p_logs JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert logs from JSONB array
  INSERT INTO system_logs (
    timestamp,
    level,
    service,
    event,
    message,
    metadata,
    user_id,
    blueprint_id,
    session_id,
    request_id,
    duration_ms,
    error_stack
  )
  SELECT
    (log->>'timestamp')::TIMESTAMPTZ,
    log->>'level',
    log->>'service',
    log->>'event',
    log->>'message',
    COALESCE(log->'metadata', '{}'::jsonb),
    (log->>'user_id')::UUID,
    (log->>'blueprint_id')::UUID,
    log->>'session_id',
    log->>'request_id',
    (log->>'duration_ms')::INTEGER,
    log->>'error_stack'
  FROM jsonb_array_elements(p_logs) AS log;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION insert_system_logs_batch IS 'Bulk insert system logs from JSONB array for performance';

-- ============================================================================
-- CLEANUP FUNCTION: Delete Old Logs
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_system_logs(
  p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete logs older than specified days
  DELETE FROM system_logs
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup action
  RAISE NOTICE 'Cleaned up % old system logs (older than % days)', v_deleted_count, p_days_to_keep;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_system_logs IS 'Delete system logs older than specified days (default: 30)';

-- ============================================================================
-- SCHEDULED CLEANUP (OPTIONAL - UNCOMMENT IF pg_cron IS AVAILABLE)
-- ============================================================================

-- Automatically cleanup logs older than 30 days every day at 3 AM
-- Requires pg_cron extension
/*
SELECT cron.schedule(
  'cleanup-system-logs',
  '0 3 * * *',  -- Every day at 3 AM
  $$SELECT cleanup_old_system_logs(30);$$
);
*/

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage to authenticated users (RLS policies will control actual access)
GRANT SELECT ON system_logs TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_logs_batch TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_system_logs TO authenticated;

-- Grant full access to service role (for background workers)
GRANT ALL ON system_logs TO service_role;

-- ============================================================================
-- ROLLBACK MIGRATION (FOR REFERENCE)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP FUNCTION IF EXISTS cleanup_old_system_logs(INTEGER);
DROP FUNCTION IF EXISTS insert_system_logs_batch(JSONB);
DROP TABLE IF EXISTS system_logs CASCADE;

-- Also remove any scheduled cron jobs:
-- SELECT cron.unschedule('cleanup-system-logs');
*/
