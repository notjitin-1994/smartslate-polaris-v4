-- Admin Reports System Migration
-- Creates tables and functions for comprehensive reporting system
-- Created: 2025-11-09

-- =====================================================
-- 1. CREATE REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'user-activity',
    'cost-analysis',
    'system-performance',
    'blueprint-generation',
    'api-usage',
    'security-audit'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Report metadata
  generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ,

  -- Report configuration
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  filters JSONB DEFAULT '{}'::jsonb,
  parameters JSONB DEFAULT '{}'::jsonb,

  -- Report data and outputs
  data JSONB,
  file_size_bytes BIGINT,
  file_url TEXT,

  -- Export formats available
  export_formats TEXT[] DEFAULT ARRAY['pdf', 'excel', 'csv', 'json'],

  -- Generation metrics
  generation_time_ms INTEGER,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexing
  CONSTRAINT valid_date_range CHECK (date_range_start IS NULL OR date_range_end IS NULL OR date_range_start <= date_range_end)
);

-- =====================================================
-- 2. CREATE SCHEDULED REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,

  -- Schedule configuration
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  schedule_time TIME NOT NULL DEFAULT '09:00:00',
  schedule_day_of_week INTEGER CHECK (schedule_day_of_week BETWEEN 0 AND 6),
  schedule_day_of_month INTEGER CHECK (schedule_day_of_month BETWEEN 1 AND 31),

  -- Report configuration
  filters JSONB DEFAULT '{}'::jsonb,
  parameters JSONB DEFAULT '{}'::jsonb,
  export_formats TEXT[] DEFAULT ARRAY['pdf'],

  -- Recipients
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE REPORT STATISTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_report_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- Daily statistics
  total_reports_generated INTEGER NOT NULL DEFAULT 0,
  reports_by_type JSONB DEFAULT '{}'::jsonb,
  average_generation_time_ms INTEGER,
  total_file_size_bytes BIGINT DEFAULT 0,

  -- Status breakdown
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admin_reports_type ON admin_reports(type);
CREATE INDEX IF NOT EXISTS idx_admin_reports_status ON admin_reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_reports_generated_by ON admin_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_admin_reports_created_at ON admin_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_reports_generated_at ON admin_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_scheduled_reports_type ON admin_scheduled_reports(type);
CREATE INDEX IF NOT EXISTS idx_admin_scheduled_reports_is_active ON admin_scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_scheduled_reports_next_run_at ON admin_scheduled_reports(next_run_at);

CREATE INDEX IF NOT EXISTS idx_admin_report_stats_date ON admin_report_stats(date DESC);

-- =====================================================
-- 5. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_admin_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================
CREATE TRIGGER update_admin_reports_updated_at_trigger
  BEFORE UPDATE ON admin_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_reports_updated_at();

CREATE TRIGGER update_admin_scheduled_reports_updated_at_trigger
  BEFORE UPDATE ON admin_scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_reports_updated_at();

CREATE TRIGGER update_admin_report_stats_updated_at_trigger
  BEFORE UPDATE ON admin_report_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_reports_updated_at();

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================
-- Enable RLS
ALTER TABLE admin_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_report_stats ENABLE ROW LEVEL SECURITY;

-- Admin reports policies (only developers and admins can access)
CREATE POLICY "Developers and admins can view all reports"
  ON admin_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

CREATE POLICY "Developers and admins can create reports"
  ON admin_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

CREATE POLICY "Developers and admins can update reports"
  ON admin_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

CREATE POLICY "Developers and admins can delete reports"
  ON admin_reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

-- Scheduled reports policies
CREATE POLICY "Developers and admins can view scheduled reports"
  ON admin_scheduled_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

CREATE POLICY "Developers and admins can manage scheduled reports"
  ON admin_scheduled_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

-- Report stats policies
CREATE POLICY "Developers and admins can view report stats"
  ON admin_report_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'enterprise', 'armada', 'fleet', 'crew')
    )
  );

CREATE POLICY "System can manage report stats"
  ON admin_report_stats FOR ALL
  USING (TRUE);

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update report statistics
CREATE OR REPLACE FUNCTION update_report_statistics()
RETURNS void AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
  v_total_reports INTEGER;
  v_reports_by_type JSONB;
  v_avg_generation_time INTEGER;
  v_total_file_size BIGINT;
  v_completed_count INTEGER;
  v_failed_count INTEGER;
BEGIN
  -- Calculate statistics for today
  SELECT
    COUNT(*),
    jsonb_object_agg(type, count),
    AVG(generation_time_ms)::INTEGER,
    SUM(file_size_bytes),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO
    v_total_reports,
    v_reports_by_type,
    v_avg_generation_time,
    v_total_file_size,
    v_completed_count,
    v_failed_count
  FROM admin_reports
  WHERE DATE(created_at) = v_date
  GROUP BY DATE(created_at);

  -- Upsert statistics
  INSERT INTO admin_report_stats (
    date,
    total_reports_generated,
    reports_by_type,
    average_generation_time_ms,
    total_file_size_bytes,
    completed_count,
    failed_count
  ) VALUES (
    v_date,
    COALESCE(v_total_reports, 0),
    COALESCE(v_reports_by_type, '{}'::jsonb),
    v_avg_generation_time,
    COALESCE(v_total_file_size, 0),
    COALESCE(v_completed_count, 0),
    COALESCE(v_failed_count, 0)
  )
  ON CONFLICT (date) DO UPDATE SET
    total_reports_generated = EXCLUDED.total_reports_generated,
    reports_by_type = EXCLUDED.reports_by_type,
    average_generation_time_ms = EXCLUDED.average_generation_time_ms,
    total_file_size_bytes = EXCLUDED.total_file_size_bytes,
    completed_count = EXCLUDED.completed_count,
    failed_count = EXCLUDED.failed_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next run time for scheduled reports
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_schedule_type TEXT,
  p_schedule_time TIME,
  p_schedule_day_of_week INTEGER,
  p_schedule_day_of_month INTEGER,
  p_from_timestamp TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
  v_base_date DATE;
BEGIN
  v_base_date := p_from_timestamp::DATE;

  CASE p_schedule_type
    WHEN 'daily' THEN
      v_next_run := (v_base_date + INTERVAL '1 day')::TIMESTAMP + p_schedule_time;

    WHEN 'weekly' THEN
      -- Calculate next occurrence of the specified day of week
      v_next_run := (v_base_date + ((7 + p_schedule_day_of_week - EXTRACT(DOW FROM v_base_date))::INTEGER % 7) * INTERVAL '1 day')::TIMESTAMP + p_schedule_time;
      IF v_next_run <= p_from_timestamp THEN
        v_next_run := v_next_run + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      -- Calculate next occurrence of the specified day of month
      v_next_run := (DATE_TRUNC('month', v_base_date) + INTERVAL '1 month' + (p_schedule_day_of_month - 1) * INTERVAL '1 day')::TIMESTAMP + p_schedule_time;

    WHEN 'quarterly' THEN
      -- Calculate next quarter
      v_next_run := (DATE_TRUNC('quarter', v_base_date) + INTERVAL '3 months' + (p_schedule_day_of_month - 1) * INTERVAL '1 day')::TIMESTAMP + p_schedule_time;
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON admin_reports TO authenticated;
GRANT ALL ON admin_scheduled_reports TO authenticated;
GRANT ALL ON admin_report_stats TO authenticated;

-- =====================================================
-- 10. COMMENTS
-- =====================================================
COMMENT ON TABLE admin_reports IS 'Stores generated admin reports with metadata, configuration, and output data';
COMMENT ON TABLE admin_scheduled_reports IS 'Manages scheduled report generation with configurable recurrence patterns';
COMMENT ON TABLE admin_report_stats IS 'Aggregated daily statistics for report generation monitoring';
COMMENT ON FUNCTION update_report_statistics() IS 'Updates daily report statistics in admin_report_stats table';
COMMENT ON FUNCTION calculate_next_run_time IS 'Calculates the next run time for a scheduled report based on schedule type and parameters';
