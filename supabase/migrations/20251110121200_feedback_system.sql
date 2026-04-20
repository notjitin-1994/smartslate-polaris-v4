-- Migration: Feedback System (Safe Version)
-- Description: Creates tables for user feedback and feature requests
-- Author: SmartSlate Team
-- Date: 2025-11-10
-- Note: This version safely handles existing types

-- ============================================================================
-- Create ENUM types (with safe error handling)
-- ============================================================================

-- Create types only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_sentiment') THEN
        CREATE TYPE feedback_sentiment AS ENUM ('positive', 'neutral', 'negative');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_category') THEN
        CREATE TYPE feedback_category AS ENUM (
          'usability',
          'performance',
          'feature',
          'bug',
          'content',
          'other'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
        CREATE TYPE feedback_status AS ENUM (
          'new',
          'reviewing',
          'addressed',
          'archived'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feature_category') THEN
        CREATE TYPE feature_category AS ENUM (
          'ai_generation',
          'questionnaire',
          'export',
          'collaboration',
          'analytics',
          'integrations',
          'mobile_app',
          'other'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_priority') THEN
        CREATE TYPE user_priority AS ENUM (
          'nice_to_have',
          'would_help',
          'must_have'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feature_status') THEN
        CREATE TYPE feature_status AS ENUM (
          'submitted',
          'reviewing',
          'planned',
          'in_progress',
          'completed',
          'declined'
        );
    END IF;
END $$;

-- ============================================================================
-- Create user_feedback table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_feedback (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback classification
  sentiment feedback_sentiment NOT NULL,
  category feedback_category NOT NULL,

  -- Feedback content
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 2000),

  -- Optional contact email (if different from user's account email)
  user_email TEXT CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

  -- Status tracking
  status feedback_status NOT NULL DEFAULT 'new',

  -- Admin notes (for internal use)
  admin_notes TEXT,

  -- Metadata
  user_agent TEXT,
  page_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Create feature_requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feature_requests (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feature request details
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 3000),

  -- Classification
  category feature_category NOT NULL,
  priority_from_user user_priority NOT NULL,

  -- Community engagement
  vote_count INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0),

  -- Optional contact email
  user_email TEXT CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

  -- Status tracking
  status feature_status NOT NULL DEFAULT 'submitted',

  -- Admin response
  admin_response TEXT,
  estimated_completion_date DATE,

  -- Metadata
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Feedback indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_feedback_user_id') THEN
        CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_feedback_status') THEN
        CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_feedback_category') THEN
        CREATE INDEX idx_user_feedback_category ON public.user_feedback(category);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_feedback_created_at') THEN
        CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_feedback_sentiment') THEN
        CREATE INDEX idx_user_feedback_sentiment ON public.user_feedback(sentiment);
    END IF;
END $$;

-- Feature request indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feature_requests_user_id') THEN
        CREATE INDEX idx_feature_requests_user_id ON public.feature_requests(user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feature_requests_status') THEN
        CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feature_requests_category') THEN
        CREATE INDEX idx_feature_requests_category ON public.feature_requests(category);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feature_requests_created_at') THEN
        CREATE INDEX idx_feature_requests_created_at ON public.feature_requests(created_at DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feature_requests_vote_count') THEN
        CREATE INDEX idx_feature_requests_vote_count ON public.feature_requests(vote_count DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_feature_requests_priority') THEN
        CREATE INDEX idx_feature_requests_priority ON public.feature_requests(priority_from_user);
    END IF;
END $$;

-- ============================================================================
-- Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Attach triggers to tables
-- ============================================================================

DROP TRIGGER IF EXISTS set_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER set_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

DROP TRIGGER IF EXISTS set_feature_requests_updated_at ON public.feature_requests;
CREATE TRIGGER set_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_FEEDBACK RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can update their own feedback within 24 hours" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins and developers can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins and developers can update all feedback" ON public.user_feedback;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own feedback (within 24 hours)
CREATE POLICY "Users can update their own feedback within 24 hours"
  ON public.user_feedback
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND status = 'new'
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Admins and Developers can view all feedback
CREATE POLICY "Admins and developers can view all feedback"
  ON public.user_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('Admin', 'Developer')
    )
  );

-- Policy: Admins and Developers can update all feedback (status, admin_notes)
CREATE POLICY "Admins and developers can update all feedback"
  ON public.user_feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('Admin', 'Developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('Admin', 'Developer')
    )
  );

-- ============================================================================
-- FEATURE_REQUESTS RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own feature requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Users can view their own feature requests" ON public.feature_requests;
DROP POLICY IF EXISTS "All authenticated users can view feature requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Users can update their own feature requests within 24 hours" ON public.feature_requests;
DROP POLICY IF EXISTS "Admins and developers can update all feature requests" ON public.feature_requests;

-- Policy: Users can insert their own feature requests
CREATE POLICY "Users can insert their own feature requests"
  ON public.feature_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feature requests
CREATE POLICY "Users can view their own feature requests"
  ON public.feature_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can view all feature requests (for upvoting in future)
CREATE POLICY "All authenticated users can view feature requests"
  ON public.feature_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own feature requests (within 24 hours)
CREATE POLICY "Users can update their own feature requests within 24 hours"
  ON public.feature_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND created_at > NOW() - INTERVAL '24 hours'
    AND status = 'submitted'
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy: Admins and Developers can update all feature requests
CREATE POLICY "Admins and developers can update all feature requests"
  ON public.feature_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('Admin', 'Developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('Admin', 'Developer')
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Get feedback statistics
CREATE OR REPLACE FUNCTION get_feedback_statistics()
RETURNS TABLE (
  total_feedback BIGINT,
  positive_count BIGINT,
  neutral_count BIGINT,
  negative_count BIGINT,
  by_category JSONB,
  by_status JSONB,
  recent_feedback JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_feedback,
    COUNT(*) FILTER (WHERE sentiment = 'positive')::BIGINT as positive_count,
    COUNT(*) FILTER (WHERE sentiment = 'neutral')::BIGINT as neutral_count,
    COUNT(*) FILTER (WHERE sentiment = 'negative')::BIGINT as negative_count,
    jsonb_object_agg(
      category,
      category_count
    ) as by_category,
    jsonb_object_agg(
      status,
      status_count
    ) as by_status,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'sentiment', sentiment,
          'category', category,
          'message', LEFT(message, 100),
          'created_at', created_at
        )
      )
      FROM (
        SELECT * FROM public.user_feedback
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    ) as recent_feedback
  FROM (
    SELECT category, COUNT(*) as category_count
    FROM public.user_feedback
    GROUP BY category
  ) cat_counts,
  (
    SELECT status, COUNT(*) as status_count
    FROM public.user_feedback
    GROUP BY status
  ) status_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get feature request statistics
CREATE OR REPLACE FUNCTION get_feature_request_statistics()
RETURNS TABLE (
  total_requests BIGINT,
  by_status JSONB,
  by_category JSONB,
  top_requested JSONB,
  recent_requests JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_requests,
    jsonb_object_agg(
      status,
      status_count
    ) as by_status,
    jsonb_object_agg(
      category,
      category_count
    ) as by_category,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'vote_count', vote_count,
          'category', category,
          'status', status
        )
      )
      FROM (
        SELECT * FROM public.feature_requests
        ORDER BY vote_count DESC
        LIMIT 10
      ) top
    ) as top_requested,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'description', LEFT(description, 150),
          'category', category,
          'priority_from_user', priority_from_user,
          'created_at', created_at
        )
      )
      FROM (
        SELECT * FROM public.feature_requests
        ORDER BY created_at DESC
        LIMIT 10
      ) recent
    ) as recent_requests
  FROM (
    SELECT status, COUNT(*) as status_count
    FROM public.feature_requests
    GROUP BY status
  ) status_counts,
  (
    SELECT category, COUNT(*) as category_count
    FROM public.feature_requests
    GROUP BY category
  ) cat_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_feedback_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_request_statistics() TO authenticated;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.user_feedback IS 'Stores user feedback submissions for product improvement';
COMMENT ON TABLE public.feature_requests IS 'Stores user feature requests with voting and tracking capabilities';

COMMENT ON COLUMN public.user_feedback.sentiment IS 'User sentiment: positive, neutral, or negative';
COMMENT ON COLUMN public.user_feedback.category IS 'Feedback category for classification';
COMMENT ON COLUMN public.user_feedback.status IS 'Current status of feedback processing';
COMMENT ON COLUMN public.user_feedback.user_email IS 'Optional alternative contact email';

COMMENT ON COLUMN public.feature_requests.vote_count IS 'Community upvotes for prioritization (future feature)';
COMMENT ON COLUMN public.feature_requests.priority_from_user IS 'User-indicated priority level';
COMMENT ON COLUMN public.feature_requests.status IS 'Current status in feature development lifecycle';
