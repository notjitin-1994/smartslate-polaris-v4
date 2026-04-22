/**
 * Feedback System Validation Schemas
 *
 * Zod schemas for validating feedback and feature request submissions.
 * These schemas ensure data integrity and provide type safety.
 */

import { z } from 'zod';

// ============================================================================
// Enum Schemas (matching database ENUMs)
// ============================================================================

export const feedbackSentimentSchema = z.enum(['positive', 'neutral', 'negative'], {
  errorMap: () => ({ message: 'Please select a sentiment' }),
});

export const feedbackCategorySchema = z.enum(
  ['usability', 'performance', 'feature', 'bug', 'content', 'other'],
  {
    errorMap: () => ({ message: 'Please select a category' }),
  }
);

export const featureCategorySchema = z.enum(
  [
    'ai_generation',
    'questionnaire',
    'export',
    'collaboration',
    'analytics',
    'integrations',
    'mobile_app',
    'other',
  ],
  {
    errorMap: () => ({ message: 'Please select a category' }),
  }
);

export const userPrioritySchema = z.enum(['nice_to_have', 'would_help', 'must_have'], {
  errorMap: () => ({ message: 'Please indicate priority' }),
});

// ============================================================================
// Feedback Submission Schema
// ============================================================================

export const feedbackSubmissionSchema = z.object({
  sentiment: feedbackSentimentSchema,
  category: feedbackCategorySchema,
  message: z
    .string()
    .min(10, 'Please provide at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
  userEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  // Client metadata
  userAgent: z.string().optional(),
  pageUrl: z.string().url().optional().or(z.literal('')),
});

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

// ============================================================================
// Feature Request Submission Schema
// ============================================================================

export const featureRequestSubmissionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(20, 'Please provide at least 20 characters describing the feature')
    .max(3000, 'Description must be less than 3000 characters')
    .trim(),
  category: featureCategorySchema,
  priorityFromUser: userPrioritySchema,
  userEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  // Client metadata
  userAgent: z.string().optional(),
});

export type FeatureRequestSubmission = z.infer<typeof featureRequestSubmissionSchema>;

// ============================================================================
// API Response Schemas
// ============================================================================

export const feedbackResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.string().uuid(),
      message: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;

export const featureRequestResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.string().uuid(),
      message: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

export type FeatureRequestResponse = z.infer<typeof featureRequestResponseSchema>;

// ============================================================================
// Display Label Maps
// ============================================================================

export const sentimentLabels: Record<z.infer<typeof feedbackSentimentSchema>, string> = {
  positive: '😊 Positive',
  neutral: '😐 Neutral',
  negative: '😞 Negative',
};

export const feedbackCategoryLabels: Record<z.infer<typeof feedbackCategorySchema>, string> = {
  usability: 'Usability',
  performance: 'Performance',
  feature: 'Feature Suggestion',
  bug: 'Bug Report',
  content: 'Content Quality',
  other: 'Other',
};

export const featureCategoryLabels: Record<z.infer<typeof featureCategorySchema>, string> = {
  ai_generation: 'AI Blueprint Generation',
  questionnaire: 'Questionnaire System',
  export: 'Export & Sharing',
  collaboration: 'Team Collaboration',
  analytics: 'Analytics & Insights',
  integrations: 'Third-party Integrations',
  mobile_app: 'Mobile Application',
  other: 'Other',
};

export const priorityLabels: Record<z.infer<typeof userPrioritySchema>, string> = {
  nice_to_have: 'Nice to Have',
  would_help: 'Would Really Help',
  must_have: 'Must Have',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user-friendly label for sentiment value
 */
export function getSentimentLabel(sentiment: z.infer<typeof feedbackSentimentSchema>): string {
  return sentimentLabels[sentiment] || sentiment;
}

/**
 * Get user-friendly label for feedback category
 */
export function getFeedbackCategoryLabel(category: z.infer<typeof feedbackCategorySchema>): string {
  return feedbackCategoryLabels[category] || category;
}

/**
 * Get user-friendly label for feature category
 */
export function getFeatureCategoryLabel(category: z.infer<typeof featureCategorySchema>): string {
  return featureCategoryLabels[category] || category;
}

/**
 * Get user-friendly label for priority
 */
export function getPriorityLabel(priority: z.infer<typeof userPrioritySchema>): string {
  return priorityLabels[priority] || priority;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
