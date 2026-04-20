/**
 * TypeScript Type Definitions for User Feedback & Issue Tracking System
 * SmartSlate Polaris v3
 */

import { z } from 'zod';

// ============================================
// Enums and Constants
// ============================================

export const FeedbackCategories = {
  TECHNICAL: 'technical',
  FEATURE: 'feature',
  GENERAL: 'general',
  DESIGN: 'design',
} as const;

export type FeedbackCategory = (typeof FeedbackCategories)[keyof typeof FeedbackCategories];

export const FeedbackStatuses = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  DUPLICATE: 'duplicate',
} as const;

export type FeedbackStatus = (typeof FeedbackStatuses)[keyof typeof FeedbackStatuses];

export const FeedbackPriorities = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  MINIMAL: 1,
} as const;

export type FeedbackPriority = (typeof FeedbackPriorities)[keyof typeof FeedbackPriorities];

export const ResponseTypes = {
  COMMENT: 'comment',
  INTERNAL_NOTE: 'internal_note',
  STATUS_CHANGE: 'status_change',
} as const;

export type ResponseType = (typeof ResponseTypes)[keyof typeof ResponseTypes];

export const SentimentScores = {
  POSITIVE: 1,
  NEUTRAL: 0,
  NEGATIVE: -1,
} as const;

export type SentimentScore = (typeof SentimentScores)[keyof typeof SentimentScores];

export const SurveyTypes = {
  GENERAL: 'general',
  POST_BLUEPRINT: 'post_blueprint',
  FEATURE_SPECIFIC: 'feature_specific',
  NPS: 'nps',
  CSAT: 'csat',
} as const;

export type SurveyType = (typeof SurveyTypes)[keyof typeof SurveyTypes];

// ============================================
// Database Types (matching Supabase schema)
// ============================================

export interface FeedbackType {
  id: string;
  name: string;
  description: string | null;
  category: FeedbackCategory;
  icon: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmission {
  id: string;
  user_id: string;
  feedback_type_id: string;
  title: string;
  description: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  metadata: Record<string, any>;
  user_agent: string | null;
  browser_info: Record<string, any> | null;
  page_url: string | null;
  error_details: Record<string, any> | null;
  sentiment_score: SentimentScore | null;
  ai_tags: string[] | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;

  // Relations (populated via joins)
  feedback_type?: FeedbackType;
  responses?: FeedbackResponse[];
  attachments?: FeedbackAttachment[];
  status_history?: FeedbackStatusHistory[];
  user?: UserInfo;
  assignee?: UserInfo;
}

export interface FeedbackResponse {
  id: string;
  feedback_id: string;
  responder_id: string;
  response: string;
  response_type: ResponseType;
  is_internal: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  responder?: UserInfo;
}

export interface FeedbackAttachment {
  id: string;
  feedback_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

export interface UserSatisfactionSurvey {
  id: string;
  user_id: string;
  rating: number;
  feedback: string | null;
  survey_type: SurveyType;
  context: Record<string, any>;
  blueprint_id: string | null;
  created_at: string;

  // Relations
  user?: UserInfo;
  blueprint?: BlueprintInfo;
}

export interface FeedbackStatusHistory {
  id: string;
  feedback_id: string;
  old_status: FeedbackStatus | null;
  new_status: FeedbackStatus;
  changed_by: string;
  change_reason: string | null;
  created_at: string;

  // Relations
  changer?: UserInfo;
}

export interface FeedbackResponseTemplate {
  id: string;
  name: string;
  category: string;
  template_text: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;

  // Relations
  creator?: UserInfo;
}

// ============================================
// Support Types
// ============================================

export interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_role?: string;
}

export interface BlueprintInfo {
  id: string;
  title: string;
  created_at: string;
}

// ============================================
// Analytics Types
// ============================================

export interface FeedbackAnalytics {
  total_submissions: number;
  open_feedback: number;
  in_progress_feedback: number;
  resolved_feedback: number;
  closed_feedback: number;
  average_priority: number;
  positive_sentiment: number;
  neutral_sentiment: number;
  negative_sentiment: number;
  average_response_time_hours: number | null;
  satisfaction_score: number | null;
  category_breakdown: Record<FeedbackCategory, number>;
  status_breakdown: Record<FeedbackStatus, number>;
  priority_breakdown: Record<string, number>;
  trend_data: FeedbackTrendData[];
}

export interface FeedbackTrendData {
  date: string;
  submissions: number;
  resolved: number;
  satisfaction: number | null;
  response_time_hours: number | null;
}

export interface SatisfactionMetrics {
  total_surveys: number;
  average_rating: number;
  satisfied_count: number;
  dissatisfied_count: number;
  satisfaction_percentage: number;
  nps_score: number | null;
  rating_distribution: Record<string, number>;
  trend_data: SatisfactionTrendData[];
}

export interface SatisfactionTrendData {
  date: string;
  average_rating: number;
  total_surveys: number;
  satisfaction_percentage: number;
}

export interface ResponseTimeMetrics {
  average_first_response_hours: number;
  median_first_response_hours: number;
  p95_response_hours: number;
  sla_compliance_percentage: number;
  overdue_count: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateFeedbackRequest {
  feedback_type_id: string;
  title: string;
  description?: string;
  priority?: FeedbackPriority;
  metadata?: Record<string, any>;
  page_url?: string;
  browser_info?: Record<string, any>;
  error_details?: Record<string, any>;
  attachments?: File[];
}

export interface UpdateFeedbackRequest {
  title?: string;
  description?: string;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  assigned_to?: string;
  ai_tags?: string[];
}

export interface CreateResponseRequest {
  response: string;
  response_type?: ResponseType;
  is_internal?: boolean;
}

export interface CreateSurveyRequest {
  rating: number;
  feedback?: string;
  survey_type: SurveyType;
  context?: Record<string, any>;
  blueprint_id?: string;
}

export interface FeedbackListParams {
  status?: FeedbackStatus | FeedbackStatus[];
  priority?: FeedbackPriority | FeedbackPriority[];
  category?: FeedbackCategory | FeedbackCategory[];
  user_id?: string;
  assigned_to?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_responses?: boolean;
  include_attachments?: boolean;
  include_history?: boolean;
}

export interface FeedbackListResponse {
  data: FeedbackSubmission[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================
// Frontend Form Types
// ============================================

export interface FeedbackFormData {
  type: 'bug' | 'feature' | 'general' | 'ui_ux' | 'performance' | 'documentation' | 'security';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  impact?: string;
  feature_area?: string;
  attachments?: File[];
  auto_capture?: boolean;
}

export interface SatisfactionSurveyData {
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  would_recommend?: boolean;
  most_valuable_feature?: string;
  least_valuable_feature?: string;
  suggestions?: string;
}

// ============================================
// Error Capture Types
// ============================================

export interface ErrorCaptureData {
  error_type: 'javascript' | 'network' | 'component' | 'api' | 'unknown';
  error_message: string;
  error_stack?: string;
  component_stack?: string;
  page_url: string;
  user_agent: string;
  browser_info: {
    name: string;
    version: string;
    platform: string;
    viewport: {
      width: number;
      height: number;
    };
  };
  session_info?: {
    duration: number;
    page_views: number;
    last_action?: string;
  };
  screenshot?: string; // base64 encoded
  console_logs?: string[];
  network_requests?: Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
  }>;
  performance_metrics?: {
    memory_usage: number;
    cpu_usage?: number;
    fps?: number;
  };
}

// ============================================
// Notification Types
// ============================================

export interface FeedbackNotification {
  id: string;
  type: 'new_response' | 'status_change' | 'assignment' | 'mention';
  feedback_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// ============================================
// Dashboard Types
// ============================================

export interface FeedbackDashboardStats {
  overview: {
    total_feedback: number;
    pending_feedback: number;
    avg_response_time: string;
    satisfaction_score: number;
    resolution_rate: number;
  };
  by_status: Record<FeedbackStatus, number>;
  by_priority: Record<string, number>;
  by_category: Record<FeedbackCategory, number>;
  recent_feedback: FeedbackSubmission[];
  trending_issues: Array<{
    title: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  team_performance: Array<{
    user_id: string;
    name: string;
    resolved_count: number;
    avg_response_time: number;
    satisfaction_rating: number;
  }>;
}

// ============================================
// Utility Types
// ============================================

export type FeedbackWithRelations = FeedbackSubmission & {
  feedback_type: FeedbackType;
  responses: FeedbackResponse[];
  attachments: FeedbackAttachment[];
  status_history: FeedbackStatusHistory[];
  user: UserInfo;
  assignee?: UserInfo;
};

export type FeedbackSortField = 'created_at' | 'updated_at' | 'priority' | 'status' | 'title';

export type FeedbackFilterOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'nin'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'between';

export interface FeedbackFilter {
  field: keyof FeedbackSubmission;
  operator: FeedbackFilterOperator;
  value: any;
}

export interface FeedbackSort {
  field: FeedbackSortField;
  direction: 'asc' | 'desc';
}

// ============================================
// Export all types for convenience
// ============================================

export type * from './feedback';
