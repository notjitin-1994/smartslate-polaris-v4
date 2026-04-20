-- Force Cleanup Remote Database
-- Run this manually in Supabase SQL Editor if tables still exist
-- This ensures all non-essential tables are dropped

BEGIN;

-- ============================================
-- Drop Analytics Views First
-- ============================================
DROP VIEW IF EXISTS feedback_analytics_summary CASCADE;
DROP VIEW IF EXISTS response_time_metrics CASCADE;
DROP VIEW IF EXISTS satisfaction_metrics CASCADE;

-- ============================================
-- Drop Triggers
-- ============================================
DROP TRIGGER IF EXISTS feedback_status_change_trigger ON feedback_submissions;
DROP TRIGGER IF EXISTS update_feedback_types_updated_at ON feedback_types;
DROP TRIGGER IF EXISTS update_feedback_submissions_updated_at ON feedback_submissions;
DROP TRIGGER IF EXISTS update_feedback_responses_updated_at ON feedback_responses;
DROP TRIGGER IF EXISTS update_feedback_response_templates_updated_at ON feedback_response_templates;

-- ============================================
-- Drop Functions
-- ============================================
DROP FUNCTION IF EXISTS log_feedback_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_feedback_updated_at() CASCADE;

-- ============================================
-- Drop Tables (in dependency order)
-- ============================================
DROP TABLE IF EXISTS feedback_attachments CASCADE;
DROP TABLE IF EXISTS feedback_responses CASCADE;
DROP TABLE IF EXISTS feedback_status_history CASCADE;
DROP TABLE IF EXISTS feedback_response_templates CASCADE;
DROP TABLE IF EXISTS feedback_submissions CASCADE;
DROP TABLE IF EXISTS feedback_types CASCADE;
DROP TABLE IF EXISTS user_satisfaction_surveys CASCADE;
DROP TABLE IF EXISTS user_usage_history CASCADE;
DROP TABLE IF EXISTS migration_log CASCADE;

-- ============================================
-- Drop Storage Policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload feedback attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own feedback attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all feedback attachments" ON storage.objects;

-- ============================================
-- Remove Storage Bucket
-- ============================================
DELETE FROM storage.buckets WHERE id = 'feedback-attachments';

-- ============================================
-- Verify What's Left
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public';

    RAISE NOTICE 'Tables remaining in public schema: %', table_count;

    -- List remaining tables
    FOR table_count IN
        SELECT tablename::text
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  - %', table_count;
    END LOOP;
END $$;

COMMIT;

-- ============================================
-- Expected Result:
-- Tables remaining in public schema: 3
--   - blueprint_generator
--   - role_audit_log
--   - user_profiles
-- ============================================
