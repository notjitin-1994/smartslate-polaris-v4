-- Migration: 20251027000000_cleanup_unused_tables.sql
-- Description: Remove all non-essential tables, keeping only core technical tables
-- Author: Database Cleanup - Polaris v3
-- Date: 2025-10-27
--
-- TABLES TO RETAIN (Core Technical):
-- - blueprint_generator (main application data)
-- - user_profiles (user management and subscriptions)
-- - role_audit_log (security audit trail)
--
-- TABLES TO DROP (Unused/Non-Essential):
-- - All feedback system tables (feedback_submissions, feedback_types, etc.)
-- - Analytics views (satisfaction_metrics, response_time_metrics, feedback_analytics_summary)
-- - User satisfaction surveys
-- - Usage history tables
-- - Migration log tables

-- ============================================
-- Drop Analytics Views First
-- ============================================
DROP VIEW IF EXISTS feedback_analytics_summary CASCADE;
DROP VIEW IF EXISTS response_time_metrics CASCADE;
DROP VIEW IF EXISTS satisfaction_metrics CASCADE;

-- ============================================
-- Drop Feedback System Tables
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS feedback_status_change_trigger ON feedback_submissions;
DROP TRIGGER IF EXISTS update_feedback_types_updated_at ON feedback_types;
DROP TRIGGER IF EXISTS update_feedback_submissions_updated_at ON feedback_submissions;
DROP TRIGGER IF EXISTS update_feedback_responses_updated_at ON feedback_responses;
DROP TRIGGER IF EXISTS update_feedback_response_templates_updated_at ON feedback_response_templates;

-- Drop functions
DROP FUNCTION IF EXISTS log_feedback_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_feedback_updated_at() CASCADE;

-- Drop tables (in dependency order - child tables first)
DROP TABLE IF EXISTS feedback_attachments CASCADE;
DROP TABLE IF EXISTS feedback_responses CASCADE;
DROP TABLE IF EXISTS feedback_status_history CASCADE;
DROP TABLE IF EXISTS feedback_response_templates CASCADE;
DROP TABLE IF EXISTS feedback_submissions CASCADE;
DROP TABLE IF EXISTS feedback_types CASCADE;

-- ============================================
-- Drop Survey Tables
-- ============================================
DROP TABLE IF EXISTS user_satisfaction_surveys CASCADE;

-- ============================================
-- Drop Unused Tracking Tables
-- ============================================
DROP TABLE IF EXISTS user_usage_history CASCADE;
DROP TABLE IF EXISTS migration_log CASCADE;

-- ============================================
-- Drop Storage Buckets
-- ============================================

-- Drop storage policies first
DROP POLICY IF EXISTS "Users can upload feedback attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own feedback attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all feedback attachments" ON storage.objects;

-- Remove storage buckets (note: this only removes the bucket record, not the actual files)
-- DELETE FROM storage.buckets WHERE id = 'feedback-attachments';;

-- Optionally drop avatars bucket if not needed
-- Uncomment the following lines to also remove avatars storage:
-- DELETE FROM storage.buckets WHERE id = 'avatars';

-- ============================================
-- Verify Core Tables Still Exist
-- ============================================

-- Add comments to document what we're keeping
COMMENT ON TABLE blueprint_generator IS 'CORE TABLE: Stores all blueprint questionnaire data and generated blueprints';
COMMENT ON TABLE user_profiles IS 'CORE TABLE: User subscription tiers, roles, and usage limits';
COMMENT ON TABLE role_audit_log IS 'CORE TABLE: Security audit trail for role changes';

-- ============================================
-- Cleanup Complete
-- ============================================

-- Summary of what was removed:
-- ✓ 6 feedback system tables
-- ✓ 3 analytics views
-- ✓ 1 survey table
-- ✓ 2 tracking tables (user_usage_history, migration_log)
-- ✓ 1 storage bucket (feedback-attachments)
-- ✓ 5 triggers
-- ✓ 2 functions
--
-- Summary of what was retained:
-- ✓ blueprint_generator (core application data)
-- ✓ user_profiles (user management)
-- ✓ role_audit_log (security audit)
-- ✓ avatars storage bucket (profile feature)
