-- Rollback Migration: 0032_create_feedback_system.sql
-- Description: Rollback for Comprehensive User Feedback & Issue Tracking System
-- Author: SmartSlate Polaris v3 Development Team
-- Date: 2025-01-25

-- ============================================
-- Drop Views
-- ============================================
DROP VIEW IF EXISTS response_time_metrics CASCADE;
DROP VIEW IF EXISTS satisfaction_metrics CASCADE;
DROP VIEW IF EXISTS feedback_analytics_summary CASCADE;

-- ============================================
-- Drop Storage Policies
-- ============================================
DROP POLICY IF EXISTS "Users can upload feedback attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own feedback attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all feedback attachments" ON storage.objects;

-- ============================================
-- Drop Triggers
-- ============================================
DROP TRIGGER IF EXISTS feedback_status_change_trigger ON feedback_submissions;
DROP TRIGGER IF EXISTS update_feedback_response_templates_updated_at ON feedback_response_templates;
DROP TRIGGER IF EXISTS update_feedback_responses_updated_at ON feedback_responses;
DROP TRIGGER IF EXISTS update_feedback_submissions_updated_at ON feedback_submissions;
DROP TRIGGER IF EXISTS update_feedback_types_updated_at ON feedback_types;

-- ============================================
-- Drop Functions
-- ============================================
DROP FUNCTION IF EXISTS log_feedback_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_feedback_updated_at() CASCADE;

-- ============================================
-- Drop RLS Policies
-- ============================================
-- Response Templates Policies
DROP POLICY IF EXISTS "Admins can manage templates" ON feedback_response_templates;
DROP POLICY IF EXISTS "Anyone can view active templates" ON feedback_response_templates;

-- Status History Policies
DROP POLICY IF EXISTS "Admins can manage status history" ON feedback_status_history;
DROP POLICY IF EXISTS "Users can view own feedback status history" ON feedback_status_history;

-- Satisfaction Surveys Policies
DROP POLICY IF EXISTS "Admins can view all surveys" ON user_satisfaction_surveys;
DROP POLICY IF EXISTS "Users can create own surveys" ON user_satisfaction_surveys;
DROP POLICY IF EXISTS "Users can view own surveys" ON user_satisfaction_surveys;

-- Attachments Policies
DROP POLICY IF EXISTS "Admins can manage all attachments" ON feedback_attachments;
DROP POLICY IF EXISTS "Users can add attachments to own feedback" ON feedback_attachments;
DROP POLICY IF EXISTS "Users can view own feedback attachments" ON feedback_attachments;

-- Responses Policies
DROP POLICY IF EXISTS "Admins can create responses" ON feedback_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON feedback_responses;
DROP POLICY IF EXISTS "Users can view responses to their feedback" ON feedback_responses;

-- Submissions Policies
DROP POLICY IF EXISTS "Admins can manage all feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback_submissions;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback_submissions;

-- Feedback Types Policies
DROP POLICY IF EXISTS "Admins can manage feedback types" ON feedback_types;
DROP POLICY IF EXISTS "Anyone can view active feedback types" ON feedback_types;

-- ============================================
-- Drop Indexes
-- ============================================
DROP INDEX IF EXISTS idx_feedback_ai_tags_gin;
DROP INDEX IF EXISTS idx_survey_context_gin;
DROP INDEX IF EXISTS idx_feedback_error_details_gin;
DROP INDEX IF EXISTS idx_feedback_browser_info_gin;
DROP INDEX IF EXISTS idx_feedback_metadata_gin;
DROP INDEX IF EXISTS idx_attachments_feedback_id;
DROP INDEX IF EXISTS idx_status_history_feedback_id;
DROP INDEX IF EXISTS idx_satisfaction_surveys_blueprint_id;
DROP INDEX IF EXISTS idx_satisfaction_surveys_rating;
DROP INDEX IF EXISTS idx_satisfaction_surveys_user_id;
DROP INDEX IF EXISTS idx_feedback_responses_responder_id;
DROP INDEX IF EXISTS idx_feedback_responses_feedback_id;
DROP INDEX IF EXISTS idx_feedback_submissions_assigned_to;
DROP INDEX IF EXISTS idx_feedback_submissions_priority;
DROP INDEX IF EXISTS idx_feedback_submissions_created_at;
DROP INDEX IF EXISTS idx_feedback_submissions_status;
DROP INDEX IF EXISTS idx_feedback_submissions_user_id;

-- ============================================
-- Drop Tables (in reverse order of dependencies)
-- ============================================
DROP TABLE IF EXISTS feedback_response_templates CASCADE;
DROP TABLE IF EXISTS feedback_status_history CASCADE;
DROP TABLE IF EXISTS user_satisfaction_surveys CASCADE;
DROP TABLE IF EXISTS feedback_attachments CASCADE;
DROP TABLE IF EXISTS feedback_responses CASCADE;
DROP TABLE IF EXISTS feedback_submissions CASCADE;
DROP TABLE IF EXISTS feedback_types CASCADE;

-- ============================================
-- Remove Storage Bucket (if it was created)
-- ============================================
DELETE FROM storage.buckets WHERE id = 'feedback-attachments';