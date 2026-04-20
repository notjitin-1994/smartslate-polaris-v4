/**
 * Centralized Question Schema Module
 *
 * Consolidates all question-related validation logic from across the codebase.
 * Provides consistent validation for question types, inputs, validation rules,
 * and conditional logic compatible with AI SDK response formats.
 *
 * @module lib/schemas/questionSchema
 */

import { z } from 'zod';

/**
 * Base question input types
 */
export const baseQuestionTypeSchema = z.enum([
  'text',
  'textarea',
  'email',
  'url',
  'number',
  'date',
  'calendar',
  'single_select',
  'multi_select',
  'select',
  'multiselect',
]);

/**
 * Enhanced question input types with rich UI components
 */
export const enhancedQuestionTypeSchema = z.enum([
  'radio_pills',
  'radio_cards',
  'checkbox_pills',
  'checkbox_cards',
  'slider',
  'scale',
  'enhanced_scale',
  'labeled_slider',
  'toggle_switch',
  'currency',
  'number_spinner',
  'rating',
  'star_rating',
  'emoji_rating',
  'file_upload',
  'image_upload',
  'color_picker',
  'time',
  'datetime',
  'phone',
  'location',
  'signature',
]);

/**
 * Complete question type schema (base + enhanced)
 */
export const questionTypeSchema = z.union([baseQuestionTypeSchema, enhancedQuestionTypeSchema]);

export type QuestionType = z.infer<typeof questionTypeSchema>;

/**
 * Validation rule types
 */
export const validationRuleTypeSchema = z.enum([
  'required',
  'min',
  'max',
  'minLength',
  'maxLength',
  'pattern',
  'email',
  'url',
  'custom',
]);

/**
 * Validation rule configuration
 */
export const validationRuleSchema = z.object({
  type: validationRuleTypeSchema,
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string().optional(),
  pattern: z.string().optional(),
});

export type ValidationRule = z.infer<typeof validationRuleSchema>;

/**
 * Conditional logic operators
 */
export const conditionalOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
]);

/**
 * Conditional logic configuration
 */
export const conditionalLogicSchema = z.object({
  questionId: z.string(),
  operator: conditionalOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  action: z.enum(['show', 'hide', 'enable', 'disable']),
});

export type ConditionalLogic = z.infer<typeof conditionalLogicSchema>;

/**
 * Option configuration for select-type questions
 */
export const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type Option = z.infer<typeof optionSchema>;

/**
 * Scale configuration for scale-type questions
 */
export const scaleConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export type ScaleConfig = z.infer<typeof scaleConfigSchema>;

/**
 * File upload configuration
 */
export const fileUploadConfigSchema = z.object({
  maxSize: z.number().optional(), // in bytes
  acceptedTypes: z.array(z.string()).optional(),
  multiple: z.boolean().optional(),
  maxFiles: z.number().optional(),
});

export type FileUploadConfig = z.infer<typeof fileUploadConfigSchema>;

/**
 * Core question schema
 */
export const questionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  question: z.string().min(1, 'Question text is required'),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  validation: z.array(validationRuleSchema).optional(),
  options: z.array(optionSchema).optional(),
  scaleConfig: scaleConfigSchema.optional(),
  fileConfig: fileUploadConfigSchema.optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  conditionalLogic: z.array(conditionalLogicSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Question = z.infer<typeof questionSchema>;

/**
 * Dynamic question schema (for AI generation)
 */
export const dynamicQuestionSchema = z.object({
  id: z.string().optional(),
  type: questionTypeSchema,
  question: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  validation: z.array(validationRuleSchema).optional(),
  options: z.array(z.union([z.string(), optionSchema])).optional(),
  scaleConfig: scaleConfigSchema.optional(),
  fileConfig: fileUploadConfigSchema.optional(),
  defaultValue: z.unknown().optional(),
  conditionalLogic: z.array(conditionalLogicSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type DynamicQuestion = z.infer<typeof dynamicQuestionSchema>;

/**
 * Question generation input schema (for AI SDK)
 */
export const questionGenerationInputSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  count: z.number().int().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  questionTypes: z.array(questionTypeSchema).optional(),
  includeDescriptions: z.boolean().default(true),
  includeValidation: z.boolean().default(true),
  context: z.string().optional(),
});

export type QuestionGenerationInput = z.infer<typeof questionGenerationInputSchema>;

/**
 * Question generation output schema (for AI SDK response)
 */
export const questionGenerationOutputSchema = z.object({
  questions: z.array(dynamicQuestionSchema),
  metadata: z
    .object({
      topic: z.string(),
      count: z.number(),
      difficulty: z.string().optional(),
      generatedAt: z.number(),
    })
    .optional(),
});

export type QuestionGenerationOutput = z.infer<typeof questionGenerationOutputSchema>;

/**
 * Utility functions for question validation
 */

/**
 * Validate and normalize a question
 */
export function validateQuestion(data: unknown): Question {
  return questionSchema.parse(data);
}

/**
 * Validate and normalize a dynamic question (with auto-ID generation)
 */
export function validateDynamicQuestion(data: unknown): Question {
  const parsed = dynamicQuestionSchema.parse(data);

  return questionSchema.parse({
    ...parsed,
    id: parsed.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    options: parsed.options?.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    ),
  });
}

/**
 * Validate question generation input
 */
export function validateQuestionGenerationInput(data: unknown): QuestionGenerationInput {
  return questionGenerationInputSchema.parse(data);
}

/**
 * Validate question generation output from AI SDK
 */
export function validateQuestionGenerationOutput(data: unknown): QuestionGenerationOutput {
  return questionGenerationOutputSchema.parse(data);
}

/**
 * Check if a question type requires options
 */
export function requiresOptions(type: QuestionType): boolean {
  return [
    'single_select',
    'multi_select',
    'select',
    'multiselect',
    'radio_pills',
    'radio_cards',
    'checkbox_pills',
    'checkbox_cards',
  ].includes(type);
}

/**
 * Check if a question type supports scale configuration
 */
export function supportsScale(type: QuestionType): boolean {
  return ['slider', 'scale', 'enhanced_scale', 'labeled_slider', 'rating', 'star_rating'].includes(
    type
  );
}

/**
 * Check if a question type supports file upload
 */
export function supportsFileUpload(type: QuestionType): boolean {
  return ['file_upload', 'image_upload', 'signature'].includes(type);
}
