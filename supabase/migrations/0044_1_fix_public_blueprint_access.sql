-- =============================================
-- Fix Public Blueprint Access via Share Links
-- =============================================
-- Migration: 0044
-- Created: 2025-11-18
-- Purpose: Enable public (anon) access to blueprints that have active share links
--
-- Background:
-- The share_links table has RLS allowing anon users to view active shares,
-- but blueprint_generator table doesn't have a corresponding policy to allow
-- anon users to fetch the actual blueprint data.
--
-- This migration adds the missing RLS policy to enable true public sharing.
-- =============================================

-- Create RLS policy for public access to shared blueprints
-- This allows unauthenticated (anon) users to SELECT blueprint_generator records
-- ONLY if there's an active share_link pointing to that blueprint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view blueprints with active share links') THEN
    CREATE POLICY "Public can view blueprints with active share links"
      ON public.blueprint_generator
      FOR SELECT
      TO anon
      USING (
        id IN (
          SELECT blueprint_id
          FROM public.share_links
          WHERE is_active = true
        )
      );
  END IF;
END $$;

-- Note: This policy allows anon users to read blueprint data, but only for
-- blueprints that have been explicitly shared via the share_links system.
-- All other RLS policies (for authenticated users) remain unchanged.

-- =============================================
-- Rollback
-- =============================================
-- To rollback this migration, run:
-- DROP POLICY IF EXISTS "Public can view blueprints with active share links" ON public.blueprint_generator;
