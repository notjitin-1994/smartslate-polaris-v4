-- Migration: Create data_exports table
-- Description: Track user data export requests for GDPR compliance
-- Author: SmartSlate Team
-- Date: 2025-11-05

BEGIN;

-- ============================================================================
-- CREATE DATA_EXPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_exports (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Export details
  export_format TEXT NOT NULL CHECK (export_format IN ('json', 'csv', 'pdf')),
  export_type TEXT NOT NULL DEFAULT 'full'
    CHECK (export_type IN ('full', 'profile', 'blueprints', 'activity', 'preferences')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),

  -- File information
  file_url TEXT,
  file_size_bytes BIGINT,
  expires_at TIMESTAMPTZ,

  -- Processing metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  processing_metadata JSONB DEFAULT '{}'::jsonb,

  -- Export content summary
  export_summary JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for querying by user_id
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id
  ON public.data_exports(user_id);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_data_exports_status
  ON public.data_exports(status);

-- Index for finding pending exports to process
CREATE INDEX IF NOT EXISTS idx_data_exports_pending
  ON public.data_exports(created_at ASC)
  WHERE status = 'pending';

-- Index for completed exports by expiration date (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_data_exports_expired
  ON public.data_exports(status, expires_at)
  WHERE status = 'completed';

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_data_exports_created_at
  ON public.data_exports(created_at DESC);

-- GIN indexes for JSONB searches
CREATE INDEX IF NOT EXISTS idx_data_exports_metadata
  ON public.data_exports USING GIN (processing_metadata);

CREATE INDEX IF NOT EXISTS idx_data_exports_summary
  ON public.data_exports USING GIN (export_summary);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.data_exports IS 'Tracks user data export requests for GDPR Article 20 compliance';
COMMENT ON COLUMN public.data_exports.id IS 'Unique identifier for the export request';
COMMENT ON COLUMN public.data_exports.user_id IS 'User who requested the export';
COMMENT ON COLUMN public.data_exports.export_format IS 'Format of the export: json, csv, or pdf';
COMMENT ON COLUMN public.data_exports.export_type IS 'Type of data to export: full, profile, blueprints, activity, or preferences';
COMMENT ON COLUMN public.data_exports.status IS 'Current status: pending, processing, completed, failed, or expired';
COMMENT ON COLUMN public.data_exports.file_url IS 'URL to download the export file (temporary, expires after 7 days)';
COMMENT ON COLUMN public.data_exports.file_size_bytes IS 'Size of the export file in bytes';
COMMENT ON COLUMN public.data_exports.expires_at IS 'When the export file expires and is deleted (typically 7 days after completion)';
COMMENT ON COLUMN public.data_exports.started_at IS 'When processing started';
COMMENT ON COLUMN public.data_exports.completed_at IS 'When processing completed successfully';
COMMENT ON COLUMN public.data_exports.failed_at IS 'When processing failed';
COMMENT ON COLUMN public.data_exports.error_message IS 'Error message if export failed';
COMMENT ON COLUMN public.data_exports.processing_metadata IS 'Additional processing details (records exported, tables included, etc.)';
COMMENT ON COLUMN public.data_exports.export_summary IS 'Summary of exported data (record counts, date ranges, etc.)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own exports
CREATE POLICY "Users can view own exports"
  ON public.data_exports FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own export requests
CREATE POLICY "Users can create own export requests"
  ON public.data_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own exports (for cancellation)
CREATE POLICY "Users can update own exports"
  ON public.data_exports FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'processing'))
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all exports
CREATE POLICY "Service role can manage all exports"
  ON public.data_exports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can view all exports (for monitoring)
CREATE POLICY "Admins can view all exports"
  ON public.data_exports FOR SELECT
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

CREATE OR REPLACE FUNCTION update_data_exports_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_data_exports_updated_at
  BEFORE UPDATE ON public.data_exports
  FOR EACH ROW
  EXECUTE FUNCTION update_data_exports_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to request data export
CREATE OR REPLACE FUNCTION request_data_export(
  p_user_id UUID,
  p_export_format TEXT DEFAULT 'json',
  p_export_type TEXT DEFAULT 'full'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_export_id UUID;
BEGIN
  -- Validate format
  IF p_export_format NOT IN ('json', 'csv', 'pdf') THEN
    RAISE EXCEPTION 'Invalid export format: %', p_export_format;
  END IF;

  -- Validate type
  IF p_export_type NOT IN ('full', 'profile', 'blueprints', 'activity', 'preferences') THEN
    RAISE EXCEPTION 'Invalid export type: %', p_export_type;
  END IF;

  -- Create export request
  INSERT INTO public.data_exports (
    user_id,
    export_format,
    export_type,
    status,
    expires_at
  )
  VALUES (
    p_user_id,
    p_export_format,
    p_export_type,
    'pending',
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO v_export_id;

  -- Log the request
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
    'data_export_requested',
    'data_export',
    v_export_id::text,
    jsonb_build_object(
      'export_format', p_export_format,
      'export_type', p_export_type
    )
  );

  RETURN v_export_id;
END;
$$;

-- Function to mark export as processing
CREATE OR REPLACE FUNCTION start_export_processing(p_export_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.data_exports
  SET
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = p_export_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function to mark export as completed
CREATE OR REPLACE FUNCTION complete_export(
  p_export_id UUID,
  p_file_url TEXT,
  p_file_size_bytes BIGINT,
  p_export_summary JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.data_exports
  SET
    status = 'completed',
    completed_at = NOW(),
    file_url = p_file_url,
    file_size_bytes = p_file_size_bytes,
    export_summary = p_export_summary,
    expires_at = NOW() + INTERVAL '7 days',
    updated_at = NOW()
  WHERE id = p_export_id
    AND status = 'processing';

  -- Log completion
  IF FOUND THEN
    INSERT INTO activity_logs (
      user_id,
      actor_id,
      action_type,
      resource_type,
      resource_id,
      metadata
    )
    SELECT
      user_id,
      user_id,
      'data_export_completed',
      'data_export',
      id::text,
      jsonb_build_object(
        'file_size_bytes', p_file_size_bytes,
        'export_summary', p_export_summary
      )
    FROM public.data_exports
    WHERE id = p_export_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- Function to mark export as failed
CREATE OR REPLACE FUNCTION fail_export(
  p_export_id UUID,
  p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.data_exports
  SET
    status = 'failed',
    failed_at = NOW(),
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_export_id
    AND status IN ('pending', 'processing');

  RETURN FOUND;
END;
$$;

-- Function to cleanup expired exports (for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Mark exports as expired
  UPDATE public.data_exports
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'completed'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Delete old expired exports (older than 30 days)
  DELETE FROM public.data_exports
  WHERE status = 'expired'
    AND expires_at < NOW() - INTERVAL '30 days';

  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION request_data_export TO authenticated;
GRANT EXECUTE ON FUNCTION start_export_processing TO service_role;
GRANT EXECUTE ON FUNCTION complete_export TO service_role;
GRANT EXECUTE ON FUNCTION fail_export TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_exports TO service_role;

COMMENT ON FUNCTION request_data_export IS 'Creates a new data export request for a user';
COMMENT ON FUNCTION start_export_processing IS 'Marks an export as processing (called by worker)';
COMMENT ON FUNCTION complete_export IS 'Marks an export as completed with file details';
COMMENT ON FUNCTION fail_export IS 'Marks an export as failed with error message';
COMMENT ON FUNCTION cleanup_expired_exports IS 'Removes expired export files and marks exports as expired';

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*

-- Request a full JSON export
SELECT request_data_export(auth.uid(), 'json', 'full');

-- Request a PDF export of profile only
SELECT request_data_export(auth.uid(), 'pdf', 'profile');

-- Get export status
SELECT id, status, export_format, export_type, file_url, created_at
FROM public.data_exports
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Worker: Start processing
SELECT start_export_processing('<export_id>');

-- Worker: Mark as completed
SELECT complete_export(
  '<export_id>',
  'https://storage.example.com/exports/user-data.json',
  12345678,
  '{"total_records": 150, "blueprints": 10, "activity_logs": 140}'::jsonb
);

-- Worker: Mark as failed
SELECT fail_export('<export_id>', 'Failed to generate PDF: insufficient permissions');

-- Cron: Cleanup expired exports
SELECT cleanup_expired_exports();

*/
