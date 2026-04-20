-- Migration: 0032_create_feedback_system.sql
-- Description: Comprehensive User Feedback & Issue Tracking System
-- Author: SmartSlate Polaris v3 Development Team
-- Date: 2025-01-25

-- ============================================
-- Feedback Types Table
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('technical', 'feature', 'general', 'design')),
    icon TEXT,
    color TEXT DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Feedback Submissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback_type_id UUID REFERENCES feedback_types(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    metadata JSONB DEFAULT '{}',
    user_agent TEXT,
    browser_info JSONB,
    page_url TEXT,
    error_details JSONB,
    sentiment_score INTEGER CHECK (sentiment_score BETWEEN -1 AND 1),
    ai_tags TEXT[],
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Feedback Responses Table
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES feedback_submissions(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    response_type TEXT DEFAULT 'comment' CHECK (response_type IN ('comment', 'internal_note', 'status_change')),
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Feedback Attachments Table
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES feedback_submissions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- User Satisfaction Surveys Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_satisfaction_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    survey_type TEXT NOT NULL DEFAULT 'general',
    context JSONB DEFAULT '{}',
    blueprint_id UUID REFERENCES blueprint_generator(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Feedback Status History Table
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES feedback_submissions(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Response Templates Table (for quick responses)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    template_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_feedback_submissions_user_id ON feedback_submissions(user_id);
CREATE INDEX idx_feedback_submissions_status ON feedback_submissions(status);
CREATE INDEX idx_feedback_submissions_created_at ON feedback_submissions(created_at DESC);
CREATE INDEX idx_feedback_submissions_priority ON feedback_submissions(priority DESC);
CREATE INDEX idx_feedback_submissions_assigned_to ON feedback_submissions(assigned_to);
CREATE INDEX idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX idx_feedback_responses_responder_id ON feedback_responses(responder_id);
CREATE INDEX idx_satisfaction_surveys_user_id ON user_satisfaction_surveys(user_id);
CREATE INDEX idx_satisfaction_surveys_rating ON user_satisfaction_surveys(rating);
CREATE INDEX idx_satisfaction_surveys_blueprint_id ON user_satisfaction_surveys(blueprint_id);
CREATE INDEX idx_status_history_feedback_id ON feedback_status_history(feedback_id);
CREATE INDEX idx_attachments_feedback_id ON feedback_attachments(feedback_id);

-- GIN index for JSONB columns
CREATE INDEX idx_feedback_metadata_gin ON feedback_submissions USING GIN (metadata);
CREATE INDEX idx_feedback_browser_info_gin ON feedback_submissions USING GIN (browser_info);
CREATE INDEX idx_feedback_error_details_gin ON feedback_submissions USING GIN (error_details);
CREATE INDEX idx_survey_context_gin ON user_satisfaction_surveys USING GIN (context);

-- GIN index for text array
CREATE INDEX idx_feedback_ai_tags_gin ON feedback_submissions USING GIN (ai_tags);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE feedback_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_response_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Feedback Types (read-only for all authenticated users)
CREATE POLICY "Anyone can view active feedback types" ON feedback_types
    FOR SELECT USING (is_active = true);

-- Admin can manage feedback types
CREATE POLICY "Admins can manage feedback types" ON feedback_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer')
        )
    );

-- Feedback Submissions Policies
-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON feedback_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON feedback_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback (limited to certain fields via API)
CREATE POLICY "Users can update own feedback" ON feedback_submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin/Support can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer', 'support')
        )
    );

-- Admin/Support can manage all feedback
CREATE POLICY "Admins can manage all feedback" ON feedback_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer')
        )
    );

-- Feedback Responses Policies
-- Users can view responses to their feedback
CREATE POLICY "Users can view responses to their feedback" ON feedback_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feedback_submissions 
            WHERE feedback_submissions.id = feedback_responses.feedback_id
            AND feedback_submissions.user_id = auth.uid()
        ) AND is_internal = false
    );

-- Admin/Support can view all responses
CREATE POLICY "Admins can view all responses" ON feedback_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer', 'support')
        )
    );

-- Admin/Support can create responses
CREATE POLICY "Admins can create responses" ON feedback_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer', 'support')
        )
    );

-- Feedback Attachments Policies
-- Users can view attachments for their feedback
CREATE POLICY "Users can view own feedback attachments" ON feedback_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feedback_submissions 
            WHERE feedback_submissions.id = feedback_attachments.feedback_id
            AND feedback_submissions.user_id = auth.uid()
        )
    );

-- Users can add attachments to their feedback
CREATE POLICY "Users can add attachments to own feedback" ON feedback_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM feedback_submissions 
            WHERE feedback_submissions.id = feedback_attachments.feedback_id
            AND feedback_submissions.user_id = auth.uid()
        )
    );

-- Admin can manage all attachments
CREATE POLICY "Admins can manage all attachments" ON feedback_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer')
        )
    );

-- User Satisfaction Surveys Policies
-- Users can view their own surveys
CREATE POLICY "Users can view own surveys" ON user_satisfaction_surveys
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own surveys
CREATE POLICY "Users can create own surveys" ON user_satisfaction_surveys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can view all surveys
CREATE POLICY "Admins can view all surveys" ON user_satisfaction_surveys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer')
        )
    );

-- Status History Policies
-- Users can view status history for their feedback
CREATE POLICY "Users can view own feedback status history" ON feedback_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM feedback_submissions 
            WHERE feedback_submissions.id = feedback_status_history.feedback_id
            AND feedback_submissions.user_id = auth.uid()
        )
    );

-- Admin can manage status history
CREATE POLICY "Admins can manage status history" ON feedback_status_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer', 'support')
        )
    );

-- Response Templates Policies
-- All authenticated users can view active templates
CREATE POLICY "Anyone can view active templates" ON feedback_response_templates
    FOR SELECT USING (is_active = true);

-- Admin can manage templates
CREATE POLICY "Admins can manage templates" ON feedback_response_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer')
        )
    );

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_feedback_types_updated_at
    BEFORE UPDATE ON feedback_types
    FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

CREATE TRIGGER update_feedback_submissions_updated_at
    BEFORE UPDATE ON feedback_submissions
    FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

CREATE TRIGGER update_feedback_responses_updated_at
    BEFORE UPDATE ON feedback_responses
    FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

CREATE TRIGGER update_feedback_response_templates_updated_at
    BEFORE UPDATE ON feedback_response_templates
    FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_feedback_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO feedback_status_history (
            feedback_id,
            old_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status change logging
CREATE TRIGGER feedback_status_change_trigger
    AFTER UPDATE ON feedback_submissions
    FOR EACH ROW EXECUTE FUNCTION log_feedback_status_change();

-- ============================================
-- Insert Default Feedback Types
-- ============================================
INSERT INTO feedback_types (name, description, category, icon, color, sort_order) VALUES
    ('Bug Report', 'Technical issues and errors', 'technical', 'bug', '#EF4444', 1),
    ('Feature Request', 'New feature suggestions', 'feature', 'lightbulb', '#3B82F6', 2),
    ('General Feedback', 'General comments and suggestions', 'general', 'message-square', '#6B7280', 3),
    ('UI/UX Issue', 'Interface and experience problems', 'design', 'palette', '#8B5CF6', 4),
    ('Performance Issue', 'Slow loading and performance problems', 'technical', 'clock', '#F59E0B', 5),
    ('Documentation', 'Documentation improvements and corrections', 'general', 'book-open', '#10B981', 6),
    ('Security Issue', 'Security concerns and vulnerabilities', 'technical', 'shield', '#DC2626', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Insert Default Response Templates
-- ============================================
INSERT INTO feedback_response_templates (name, category, template_text) VALUES
    ('Thank You', 'general', 'Thank you for your feedback! We appreciate you taking the time to help us improve SmartSlate. We''ll review your suggestion and get back to you soon.'),
    ('Bug Acknowledged', 'technical', 'Thank you for reporting this issue. We''ve logged it in our tracking system and our development team will investigate. We''ll update you once we have more information.'),
    ('Feature Under Review', 'feature', 'Thank you for your feature request! We''re always looking for ways to improve SmartSlate. We''ll review your suggestion with our product team and consider it for future updates.'),
    ('Need More Info', 'general', 'Thank you for your feedback. To better understand and address your concern, could you please provide more details about: [specify what information is needed]?'),
    ('Issue Resolved', 'technical', 'Good news! The issue you reported has been resolved in our latest update. Please refresh your browser or clear your cache to see the changes. Let us know if you continue to experience any problems.'),
    ('Duplicate Report', 'technical', 'Thank you for your report. This issue has already been identified and is being worked on. We''ve linked your feedback to the existing ticket and will notify you once it''s resolved.')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Create Storage Bucket for Attachments
-- ============================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'feedback-attachments',
    'feedback-attachments',
    false,
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/json']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for feedback attachments
CREATE POLICY "Users can upload feedback attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'feedback-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own feedback attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'feedback-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can manage all feedback attachments" ON storage.objects
    FOR ALL USING (
        bucket_id = 'feedback-attachments' AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_role IN ('admin', 'developer')
        )
    );

-- ============================================
-- Analytics Views
-- ============================================

-- View for feedback analytics summary
CREATE OR REPLACE VIEW feedback_analytics_summary AS
SELECT 
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_feedback,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_feedback,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_feedback,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_feedback,
    ROUND(AVG(priority)::numeric, 2) as avg_priority,
    COUNT(CASE WHEN sentiment_score = 1 THEN 1 END) as positive_sentiment,
    COUNT(CASE WHEN sentiment_score = 0 THEN 1 END) as neutral_sentiment,
    COUNT(CASE WHEN sentiment_score = -1 THEN 1 END) as negative_sentiment
FROM feedback_submissions;

-- View for satisfaction metrics
CREATE OR REPLACE VIEW satisfaction_metrics AS
SELECT 
    COUNT(*) as total_surveys,
    ROUND(AVG(rating)::numeric, 2) as avg_rating,
    COUNT(CASE WHEN rating >= 4 THEN 1 END) as satisfied_count,
    COUNT(CASE WHEN rating <= 2 THEN 1 END) as dissatisfied_count,
    ROUND((COUNT(CASE WHEN rating >= 4 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100), 2) as satisfaction_percentage
FROM user_satisfaction_surveys;

-- View for response time metrics
CREATE OR REPLACE VIEW response_time_metrics AS
SELECT 
    fs.id,
    fs.created_at as submission_time,
    MIN(fr.created_at) as first_response_time,
    EXTRACT(EPOCH FROM (MIN(fr.created_at) - fs.created_at)) / 3600 as response_time_hours
FROM feedback_submissions fs
LEFT JOIN feedback_responses fr ON fs.id = fr.feedback_id
WHERE fr.response_type != 'internal_note'
GROUP BY fs.id, fs.created_at;

-- Grant permissions on views
GRANT SELECT ON feedback_analytics_summary TO authenticated;
GRANT SELECT ON satisfaction_metrics TO authenticated;
GRANT SELECT ON response_time_metrics TO authenticated;

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE feedback_types IS 'Predefined categories for user feedback';
COMMENT ON TABLE feedback_submissions IS 'Main table for all user feedback submissions';
COMMENT ON TABLE feedback_responses IS 'Responses and internal notes for feedback';
COMMENT ON TABLE feedback_attachments IS 'File attachments for feedback submissions';
COMMENT ON TABLE user_satisfaction_surveys IS 'User satisfaction and NPS surveys';
COMMENT ON TABLE feedback_status_history IS 'Audit trail of feedback status changes';
COMMENT ON TABLE feedback_response_templates IS 'Quick response templates for support team';