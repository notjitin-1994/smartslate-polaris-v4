-- ============================================================================
-- Migration: 0040_presentation_slides_system.sql
-- Feature: Presentation Mode - Slide Type System
-- Task: Task 3 - Implement Slide Type System and Interfaces
-- Date: 2025-11-14
-- Author: Claude Code
--
-- Description:
-- Creates comprehensive database schema for presentation slides including:
-- - presentations table (metadata and settings)
-- - presentation_slides table (individual slides with JSONB content)
-- - Performance indexes (B-tree + GIN for JSONB)
-- - Row Level Security policies
-- - Automatic timestamp triggers
-- - Data validation constraints
--
-- Dependencies: blueprint_generator table (migration 0003)
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- presentations table: Stores presentation metadata
CREATE TABLE IF NOT EXISTS public.presentations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  blueprint_id UUID NOT NULL REFERENCES public.blueprint_generator(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core Metadata
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,

  -- Presentation Settings (JSONB)
  settings JSONB NOT NULL DEFAULT jsonb_build_object(
    'theme', 'dark',
    'fontSize', 'medium',
    'animations', true,
    'transitions', true,
    'laserPointerColor', '#14b8a6',
    'laserPointerSize', 16,
    'showProgressBar', true,
    'showSlideNumbers', true,
    'showTimer', false,
    'autoHideControls', true,
    'autoHideDelay', 3000,
    'navigation', jsonb_build_object(
      'enableKeyboard', true,
      'enableSwipe', true,
      'enableWheel', true,
      'loop', false,
      'autoAdvance', false
    ),
    'shortcuts', jsonb_build_object(
      'nextSlide', json_build_array('ArrowRight', 'Space', 'PageDown'),
      'previousSlide', json_build_array('ArrowLeft', 'PageUp'),
      'firstSlide', json_build_array('Home'),
      'lastSlide', json_build_array('End'),
      'toggleFullscreen', json_build_array('f', 'F11'),
      'toggleSpeakerNotes', json_build_array('s', 'n'),
      'toggleLaserPointer', json_build_array('l'),
      'togglePlay', json_build_array('p'),
      'exitPresentation', json_build_array('Escape')
    )
  ),

  -- Flexible Metadata Storage
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Status Workflow
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.presentations IS 'Stores presentation metadata generated from learning blueprints';
COMMENT ON COLUMN public.presentations.settings IS 'Presentation configuration including theme, controls, keyboard shortcuts';
COMMENT ON COLUMN public.presentations.metadata IS 'Flexible metadata storage for tags, version, thumbnail URL, etc.';

-- presentation_slides table: Stores individual slides
CREATE TABLE IF NOT EXISTS public.presentation_slides (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,

  -- Slide Identification
  slide_index INTEGER NOT NULL CHECK (slide_index >= 0),
  slide_id TEXT NOT NULL,

  -- Slide Type (8 layout types)
  slide_type TEXT NOT NULL CHECK (slide_type IN (
    'cover',      -- Title/introduction slide
    'section',    -- Section divider
    'content',    -- General content with text/images
    'metrics',    -- KPIs and statistics
    'module',     -- Learning module overview
    'timeline',   -- Chronological events
    'resources',  -- Links and references
    'chart'       -- Data visualizations
  )),

  -- Core Content
  title TEXT NOT NULL,
  subtitle TEXT,

  -- Type-specific Content (JSONB)
  content JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Slide Configuration
  transition TEXT DEFAULT 'slide'
    CHECK (transition IN ('fade', 'slide', 'zoom', 'none')),
  duration INTEGER CHECK (duration IS NULL OR duration > 0),  -- milliseconds
  speaker_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique Constraints
  CONSTRAINT presentation_slides_unique_index
    UNIQUE (presentation_id, slide_index),
  CONSTRAINT presentation_slides_unique_id
    UNIQUE (presentation_id, slide_id)
);

COMMENT ON TABLE public.presentation_slides IS 'Individual slides within presentations with type-specific JSONB content';
COMMENT ON COLUMN public.presentation_slides.slide_index IS '0-based ordinal position for sorting';
COMMENT ON COLUMN public.presentation_slides.slide_id IS 'Human-readable identifier (e.g., "cover-1", "metrics-2")';
COMMENT ON COLUMN public.presentation_slides.content IS 'Type-specific slide data stored as JSONB for flexibility';
COMMENT ON COLUMN public.presentation_slides.duration IS 'Auto-advance duration in milliseconds (null = manual advance)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Presentations Table Indexes
CREATE INDEX idx_presentations_blueprint_id
  ON public.presentations(blueprint_id);

CREATE INDEX idx_presentations_user_id
  ON public.presentations(user_id);

CREATE INDEX idx_presentations_status
  ON public.presentations(status)
  WHERE status != 'archived';  -- Partial index for active presentations

CREATE INDEX idx_presentations_created_at
  ON public.presentations(created_at DESC);

-- GIN index for JSONB settings queries
CREATE INDEX idx_presentations_settings_gin
  ON public.presentations USING GIN (settings);

-- GIN index for JSONB metadata queries
CREATE INDEX idx_presentations_metadata_gin
  ON public.presentations USING GIN (metadata);

-- Presentation Slides Table Indexes
CREATE INDEX idx_presentation_slides_presentation_id
  ON public.presentation_slides(presentation_id);

CREATE INDEX idx_presentation_slides_slide_type
  ON public.presentation_slides(slide_type);

-- Composite index for ordered slide queries
CREATE INDEX idx_presentation_slides_presentation_index
  ON public.presentation_slides(presentation_id, slide_index);

-- GIN index for JSONB content queries
CREATE INDEX idx_presentation_slides_content_gin
  ON public.presentation_slides USING GIN (content);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for presentations
CREATE OR REPLACE FUNCTION update_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_presentations_updated_at();

-- Auto-update updated_at timestamp for presentation_slides
CREATE OR REPLACE FUNCTION update_presentation_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_presentation_slides_updated_at
  BEFORE UPDATE ON public.presentation_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_presentation_slides_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on presentations table
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- Presentations Policies
CREATE POLICY "Users can select own presentations"
  ON public.presentations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own presentations"
  ON public.presentations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    blueprint_id IN (
      SELECT id FROM public.blueprint_generator WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own presentations"
  ON public.presentations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own presentations"
  ON public.presentations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable RLS on presentation_slides table
ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;

-- Presentation Slides Policies
CREATE POLICY "Users can select own presentation slides"
  ON public.presentation_slides
  FOR SELECT
  TO authenticated
  USING (
    presentation_id IN (
      SELECT id FROM public.presentations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own presentation slides"
  ON public.presentation_slides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    presentation_id IN (
      SELECT id FROM public.presentations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own presentation slides"
  ON public.presentation_slides
  FOR UPDATE
  TO authenticated
  USING (
    presentation_id IN (
      SELECT id FROM public.presentations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    presentation_id IN (
      SELECT id FROM public.presentations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own presentation slides"
  ON public.presentation_slides
  FOR DELETE
  TO authenticated
  USING (
    presentation_id IN (
      SELECT id FROM public.presentations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get total slide count for a presentation
CREATE OR REPLACE FUNCTION get_presentation_slide_count(p_presentation_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.presentation_slides
  WHERE presentation_id = p_presentation_id;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_presentation_slide_count IS 'Returns total number of slides in a presentation';

-- Function to get slides by type for a presentation
CREATE OR REPLACE FUNCTION get_presentation_slides_by_type(
  p_presentation_id UUID,
  p_slide_type TEXT
)
RETURNS SETOF public.presentation_slides AS $$
  SELECT *
  FROM public.presentation_slides
  WHERE presentation_id = p_presentation_id
    AND slide_type = p_slide_type
  ORDER BY slide_index;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_presentation_slides_by_type IS 'Returns all slides of a specific type from a presentation';

-- ============================================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================================

-- NOTE: Commented out for production. Uncomment for local development.
--
-- INSERT INTO public.presentations (blueprint_id, user_id, title, description, author)
-- SELECT
--   id as blueprint_id,
--   user_id,
--   'Sample Presentation: ' || COALESCE(title, 'Untitled Blueprint'),
--   'Auto-generated presentation from blueprint',
--   'System'
-- FROM public.blueprint_generator
-- WHERE status = 'completed'
-- LIMIT 1;

-- ============================================================================
-- STATISTICS
-- ============================================================================

-- Update table statistics for query planner
ANALYZE public.presentations;
ANALYZE public.presentation_slides;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 0040_presentation_slides_system.sql completed successfully';
  RAISE NOTICE 'Created tables: presentations, presentation_slides';
  RAISE NOTICE 'Created indexes: 10 total (6 B-tree, 3 GIN, 1 partial)';
  RAISE NOTICE 'Created RLS policies: 8 total (4 per table)';
  RAISE NOTICE 'Created triggers: 2 (timestamp auto-update)';
  RAISE NOTICE 'Created functions: 2 (helper functions)';
END $$;
