/**
 * Zod Validation Schemas for User Feedback & Issue Tracking System
 * SmartSlate Polaris v3
 */

import { z } from 'zod';
import {
  FeedbackCategories,
  FeedbackStatuses,
  FeedbackPriorities,
  ResponseTypes,
  SentimentScores,
  SurveyTypes,
} from '@/lib/types/feedback';

// ============================================
// Enum Schemas
// ============================================

export const feedbackCategorySchema = z.enum([
  FeedbackCategories.TECHNICAL,
  FeedbackCategories.FEATURE,
  FeedbackCategories.GENERAL,
  FeedbackCategories.DESIGN,
]);

export const feedbackStatusSchema = z.enum([
  FeedbackStatuses.OPEN,
  FeedbackStatuses.IN_PROGRESS,
  FeedbackStatuses.RESOLVED,
  FeedbackStatuses.CLOSED,
  FeedbackStatuses.DUPLICATE,
]);

export const feedbackPrioritySchema = z.number().int().min(1).max(5);

export const responseTypeSchema = z.enum([
  ResponseTypes.COMMENT,
  ResponseTypes.INTERNAL_NOTE,
  ResponseTypes.STATUS_CHANGE,
]);

export const sentimentScoreSchema = z.number().int().min(-1).max(1);

export const surveyTypeSchema = z.enum([
  SurveyTypes.GENERAL,
  SurveyTypes.POST_BLUEPRINT,
  SurveyTypes.FEATURE_SPECIFIC,
  SurveyTypes.NPS,
  SurveyTypes.CSAT,
]);

// ============================================
// Entity Schemas
// ============================================

export const feedbackTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  category: feedbackCategorySchema,
  icon: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .default('#6B7280'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const feedbackSubmissionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  feedback_type_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000).nullable().optional(),
  status: feedbackStatusSchema.default('open'),
  priority: feedbackPrioritySchema.default(3),
  metadata: z.record(z.any()).default({}),
  user_agent: z.string().nullable().optional(),
  browser_info: z.record(z.any()).nullable().optional(),
  page_url: z.string().url().nullable().optional(),
  error_details: z.record(z.any()).nullable().optional(),
  sentiment_score: sentimentScoreSchema.nullable().optional(),
  ai_tags: z.array(z.string()).nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const feedbackResponseSchema = z.object({
  id: z.string().uuid(),
  feedback_id: z.string().uuid(),
  responder_id: z.string().uuid(),
  response: z.string().min(1).max(10000),
  response_type: responseTypeSchema.default('comment'),
  is_internal: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const feedbackAttachmentSchema = z.object({
  id: z.string().uuid(),
  feedback_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  file_type: z.string().min(1).max(100),
  file_size: z.number().int().positive().max(10485760), // 10MB max
  file_url: z.string().url(),
  created_at: z.string().datetime(),
});

export const userSatisfactionSurveySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(5000).nullable().optional(),
  survey_type: surveyTypeSchema.default('general'),
  context: z.record(z.any()).default({}),
  blueprint_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
});

export const feedbackStatusHistorySchema = z.object({
  id: z.string().uuid(),
  feedback_id: z.string().uuid(),
  old_status: feedbackStatusSchema.nullable().optional(),
  new_status: feedbackStatusSchema,
  changed_by: z.string().uuid(),
  change_reason: z.string().max(500).nullable().optional(),
  created_at: z.string().datetime(),
});

export const feedbackResponseTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  template_text: z.string().min(1).max(2000),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================
// Request/Response Schemas
// ============================================

export const createFeedbackRequestSchema = z.object({
  feedback_type_id: z.string().uuid(),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .trim()
    .optional(),
  priority: feedbackPrioritySchema.optional(),
  metadata: z.record(z.any()).optional(),
  page_url: z.string().url().optional().or(z.literal('')),
  browser_info: z.record(z.any()).optional(),
  error_details: z.record(z.any()).optional(),
});

export const updateFeedbackRequestSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .trim()
    .optional()
    .nullable(),
  status: feedbackStatusSchema.optional(),
  priority: feedbackPrioritySchema.optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  ai_tags: z.array(z.string()).optional(),
});

export const createResponseRequestSchema = z.object({
  response: z
    .string()
    .min(1, 'Response cannot be empty')
    .max(10000, 'Response must be less than 10000 characters')
    .trim(),
  response_type: responseTypeSchema.optional(),
  is_internal: z.boolean().optional(),
});

export const createSurveyRequestSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  feedback: z.string().max(5000, 'Feedback must be less than 5000 characters').trim().optional(),
  survey_type: surveyTypeSchema,
  context: z.record(z.any()).optional(),
  blueprint_id: z.string().uuid().optional(),
});

// ============================================
// Form Validation Schemas
// ============================================

export const feedbackFormSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'ui_ux', 'performance', 'documentation', 'security']),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(5000, 'Description must be less than 5000 characters')
    .trim(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  steps_to_reproduce: z.string().max(2000).optional(),
  expected_behavior: z.string().max(1000).optional(),
  actual_behavior: z.string().max(1000).optional(),
  impact: z.string().max(1000).optional(),
  feature_area: z.string().max(100).optional(),
  auto_capture: z.boolean().optional(),
});

export const bugReportFormSchema = feedbackFormSchema.extend({
  type: z.literal('bug'),
  steps_to_reproduce: z
    .string()
    .min(10, 'Please describe the steps to reproduce the issue')
    .max(2000, 'Steps must be less than 2000 characters'),
  expected_behavior: z
    .string()
    .min(5, 'Please describe what you expected to happen')
    .max(1000, 'Expected behavior must be less than 1000 characters'),
  actual_behavior: z
    .string()
    .min(5, 'Please describe what actually happened')
    .max(1000, 'Actual behavior must be less than 1000 characters'),
});

export const featureRequestFormSchema = feedbackFormSchema.extend({
  type: z.literal('feature'),
  impact: z
    .string()
    .min(10, 'Please describe the impact this feature would have')
    .max(1000, 'Impact description must be less than 1000 characters'),
  feature_area: z
    .string()
    .min(2, 'Please specify the feature area')
    .max(100, 'Feature area must be less than 100 characters'),
});

export const satisfactionSurveyFormSchema = z.object({
  rating: z
    .number()
    .int('Please select a rating')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  feedback: z.string().max(5000, 'Feedback must be less than 5000 characters').trim().optional(),
  would_recommend: z.boolean().optional(),
  most_valuable_feature: z.string().max(500).trim().optional(),
  least_valuable_feature: z.string().max(500).trim().optional(),
  suggestions: z.string().max(2000).trim().optional(),
});

// ============================================
// Query Parameter Schemas
// ============================================

export const feedbackListParamsSchema = z.object({
  status: z.union([feedbackStatusSchema, z.array(feedbackStatusSchema)]).optional(),
  priority: z.union([feedbackPrioritySchema, z.array(feedbackPrioritySchema)]).optional(),
  category: z.union([feedbackCategorySchema, z.array(feedbackCategorySchema)]).optional(),
  user_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'priority', 'status']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  include_responses: z.boolean().optional(),
  include_attachments: z.boolean().optional(),
  include_history: z.boolean().optional(),
});

// ============================================
// Error Capture Schemas
// ============================================

export const errorCaptureDataSchema = z.object({
  error_type: z.enum(['javascript', 'network', 'component', 'api', 'unknown']),
  error_message: z.string().max(1000),
  error_stack: z.string().max(10000).optional(),
  component_stack: z.string().max(5000).optional(),
  page_url: z.string().url(),
  user_agent: z.string(),
  browser_info: z.object({
    name: z.string(),
    version: z.string(),
    platform: z.string(),
    viewport: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
    }),
  }),
  session_info: z
    .object({
      duration: z.number().positive(),
      page_views: z.number().int().positive(),
      last_action: z.string().optional(),
    })
    .optional(),
  screenshot: z.string().optional(), // base64 encoded
  console_logs: z.array(z.string()).max(100).optional(),
  network_requests: z
    .array(
      z.object({
        url: z.string().url(),
        method: z.string(),
        status: z.number().int(),
        duration: z.number().positive(),
      })
    )
    .max(50)
    .optional(),
  performance_metrics: z
    .object({
      memory_usage: z.number().positive(),
      cpu_usage: z.number().positive().optional(),
      fps: z.number().positive().optional(),
    })
    .optional(),
});

// ============================================
// Bulk Operation Schemas
// ============================================

export const bulkUpdateFeedbackSchema = z.object({
  feedback_ids: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: feedbackStatusSchema.optional(),
    priority: feedbackPrioritySchema.optional(),
    assigned_to: z.string().uuid().optional().nullable(),
  }),
  reason: z.string().max(500).optional(),
});

export const bulkDeleteFeedbackSchema = z.object({
  feedback_ids: z.array(z.string().uuid()).min(1).max(100),
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm the bulk delete operation' }),
  }),
});

// ============================================
// File Upload Schemas
// ============================================

export const fileUploadSchema = z
  .object({
    file: z.instanceof(File),
    max_size: z.number().positive().default(10485760), // 10MB
    allowed_types: z
      .array(z.string())
      .default([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json',
      ]),
  })
  .refine(
    (data) => data.file.size <= data.max_size,
    (data) => ({
      message: `File size must be less than ${data.max_size / 1048576}MB`,
    })
  )
  .refine((data) => data.allowed_types.includes(data.file.type), {
    message: 'File type not allowed',
  });

// ============================================
// Response Schemas for API Endpoints
// ============================================

export const feedbackListResponseSchema = z.object({
  data: z.array(feedbackSubmissionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  has_more: z.boolean(),
});

export const feedbackAnalyticsSchema = z.object({
  total_submissions: z.number().int().nonnegative(),
  open_feedback: z.number().int().nonnegative(),
  in_progress_feedback: z.number().int().nonnegative(),
  resolved_feedback: z.number().int().nonnegative(),
  closed_feedback: z.number().int().nonnegative(),
  average_priority: z.number(),
  positive_sentiment: z.number().int().nonnegative(),
  neutral_sentiment: z.number().int().nonnegative(),
  negative_sentiment: z.number().int().nonnegative(),
  average_response_time_hours: z.number().nullable(),
  satisfaction_score: z.number().nullable(),
  category_breakdown: z.record(feedbackCategorySchema, z.number()),
  status_breakdown: z.record(feedbackStatusSchema, z.number()),
  priority_breakdown: z.record(z.string(), z.number()),
  trend_data: z.array(
    z.object({
      date: z.string(),
      submissions: z.number().int().nonnegative(),
      resolved: z.number().int().nonnegative(),
      satisfaction: z.number().nullable(),
      response_time_hours: z.number().nullable(),
    })
  ),
});

export const satisfactionMetricsSchema = z.object({
  total_surveys: z.number().int().nonnegative(),
  average_rating: z.number(),
  satisfied_count: z.number().int().nonnegative(),
  dissatisfied_count: z.number().int().nonnegative(),
  satisfaction_percentage: z.number(),
  nps_score: z.number().nullable(),
  rating_distribution: z.record(z.string(), z.number()),
  trend_data: z.array(
    z.object({
      date: z.string(),
      average_rating: z.number(),
      total_surveys: z.number().int().nonnegative(),
      satisfaction_percentage: z.number(),
    })
  ),
});

// ============================================
// Type Exports from Schemas
// ============================================

export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;
export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;
export type FeedbackAttachment = z.infer<typeof feedbackAttachmentSchema>;
export type UserSatisfactionSurvey = z.infer<typeof userSatisfactionSurveySchema>;
export type FeedbackStatusHistory = z.infer<typeof feedbackStatusHistorySchema>;
export type FeedbackResponseTemplate = z.infer<typeof feedbackResponseTemplateSchema>;

export type CreateFeedbackRequest = z.infer<typeof createFeedbackRequestSchema>;
export type UpdateFeedbackRequest = z.infer<typeof updateFeedbackRequestSchema>;
export type CreateResponseRequest = z.infer<typeof createResponseRequestSchema>;
export type CreateSurveyRequest = z.infer<typeof createSurveyRequestSchema>;

export type FeedbackForm = z.infer<typeof feedbackFormSchema>;
export type BugReportForm = z.infer<typeof bugReportFormSchema>;
export type FeatureRequestForm = z.infer<typeof featureRequestFormSchema>;
export type SatisfactionSurveyForm = z.infer<typeof satisfactionSurveyFormSchema>;

export type FeedbackListParams = z.infer<typeof feedbackListParamsSchema>;
export type FeedbackListResponse = z.infer<typeof feedbackListResponseSchema>;
export type FeedbackAnalytics = z.infer<typeof feedbackAnalyticsSchema>;
export type SatisfactionMetrics = z.infer<typeof satisfactionMetricsSchema>;

export type ErrorCaptureData = z.infer<typeof errorCaptureDataSchema>;
export type BulkUpdateFeedback = z.infer<typeof bulkUpdateFeedbackSchema>;
export type BulkDeleteFeedback = z.infer<typeof bulkDeleteFeedbackSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
