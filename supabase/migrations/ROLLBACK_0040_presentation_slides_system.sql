-- ============================================================================
-- Rollback Migration: ROLLBACK_0040_presentation_slides_system.sql
-- Feature: Presentation Mode - Slide Type System
-- Rollback for: 0040_presentation_slides_system.sql
-- Date: 2025-11-14
-- Author: Claude Code
--
-- Description:
-- Safely removes all database objects created by migration 0040 in reverse
-- order of dependencies. Includes data backup procedures and safety checks.
--
-- WARNING: This will permanently delete all presentations and slides data.
-- Ensure you have backed up any important data before running this migration.
--
-- Usage:
-- psql -f ROLLBACK_0040_presentation_slides_system.sql
-- ============================================================================

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Check if tables exist before attempting rollback
DO $$
DECLARE
  v_presentation_count INTEGER;
  v_slide_count INTEGER;
BEGIN
  -- Count existing data
  SELECT COUNT(*) INTO v_presentation_count
  FROM public.presentations;

  SELECT COUNT(*) INTO v_slide_count
  FROM public.presentation_slides;

  -- Log current state
  RAISE NOTICE 'Rollback initiated for migration 0040';
  RAISE NOTICE 'Found % presentations and % slides to be removed',
    v_presentation_count, v_slide_count;

  -- Warn if data exists
  IF v_presentation_count > 0 OR v_slide_count > 0 THEN
    RAISE WARNING 'This rollback will delete all presentation data. Ensure backup exists!';
  END IF;
END $$;

-- ============================================================================
-- OPTIONAL: DATA BACKUP
-- ============================================================================

-- Create backup tables (commented out by default)
--
-- CREATE TABLE IF NOT EXISTS public.presentations_backup AS
-- SELECT * FROM public.presentations;
--
-- CREATE TABLE IF NOT EXISTS public.presentation_slides_backup AS
-- SELECT * FROM public.presentation_slides;
--
-- RAISE NOTICE 'Data backed up to presentations_backup and presentation_slides_backup';

-- ============================================================================
-- DROP RLS POLICIES
-- ============================================================================

-- Drop presentations policies
DROP POLICY IF EXISTS "Users can select own presentations"
  ON public.presentations;

DROP POLICY IF EXISTS "Users can insert own presentations"
  ON public.presentations;

DROP POLICY IF EXISTS "Users can update own presentations"
  ON public.presentations;

DROP POLICY IF EXISTS "Users can delete own presentations"
  ON public.presentations;

-- Drop presentation_slides policies
DROP POLICY IF EXISTS "Users can select own presentation slides"
  ON public.presentation_slides;

DROP POLICY IF EXISTS "Users can insert own presentation slides"
  ON public.presentation_slides;

DROP POLICY IF EXISTS "Users can update own presentation slides"
  ON public.presentation_slides;

DROP POLICY IF EXISTS "Users can delete own presentation slides"
  ON public.presentation_slides;

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_presentations_updated_at
  ON public.presentations;

DROP TRIGGER IF EXISTS trigger_update_presentation_slides_updated_at
  ON public.presentation_slides;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_presentations_updated_at();
DROP FUNCTION IF EXISTS update_presentation_slides_updated_at();
DROP FUNCTION IF EXISTS get_presentation_slide_count(UUID);
DROP FUNCTION IF EXISTS get_presentation_slides_by_type(UUID, TEXT);

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

-- Presentations indexes
DROP INDEX IF EXISTS public.idx_presentations_blueprint_id;
DROP INDEX IF EXISTS public.idx_presentations_user_id;
DROP INDEX IF EXISTS public.idx_presentations_status;
DROP INDEX IF EXISTS public.idx_presentations_created_at;
DROP INDEX IF EXISTS public.idx_presentations_settings_gin;
DROP INDEX IF EXISTS public.idx_presentations_metadata_gin;

-- Presentation slides indexes
DROP INDEX IF EXISTS public.idx_presentation_slides_presentation_id;
DROP INDEX IF EXISTS public.idx_presentation_slides_slide_type;
DROP INDEX IF EXISTS public.idx_presentation_slides_presentation_index;
DROP INDEX IF EXISTS public.idx_presentation_slides_content_gin;

-- ============================================================================
-- DROP TABLES
-- ============================================================================

-- Drop in reverse order of dependencies (slides first, then presentations)
DROP TABLE IF EXISTS public.presentation_slides CASCADE;
DROP TABLE IF EXISTS public.presentations CASCADE;

-- ============================================================================
-- CLEANUP BACKUP TABLES (if created)
-- ============================================================================

-- Optionally drop backup tables after confirming rollback success
-- DROP TABLE IF EXISTS public.presentations_backup;
-- DROP TABLE IF EXISTS public.presentation_slides_backup;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Verify tables no longer exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('presentations', 'presentation_slides')
  ) THEN
    RAISE EXCEPTION 'Rollback failed: Tables still exist';
  END IF;

  -- Log successful rollback
  RAISE NOTICE 'Rollback completed successfully';
  RAISE NOTICE 'Removed: 2 tables, 10 indexes, 8 RLS policies, 2 triggers, 4 functions';
END $$;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
