/**
 * Centralized Schema Exports
 *
 * Single entry point for all Zod schemas and validation utilities.
 * This module consolidates validation logic from across the codebase
 * into a centralized, version-controlled schema system.
 *
 * @module lib/schemas
 */

// Question schemas
export {
  // Base schemas
  baseQuestionTypeSchema,
  enhancedQuestionTypeSchema,
  questionTypeSchema,
  validationRuleTypeSchema,
  validationRuleSchema,
  conditionalOperatorSchema,
  conditionalLogicSchema,
  optionSchema,
  scaleConfigSchema,
  fileUploadConfigSchema,

  // Question schemas
  questionSchema,
  dynamicQuestionSchema,

  // Generation schemas
  questionGenerationInputSchema,
  questionGenerationOutputSchema,

  // Types
  type QuestionType,
  type ValidationRule,
  type ConditionalLogic,
  type Option,
  type ScaleConfig,
  type FileUploadConfig,
  type Question,
  type DynamicQuestion,
  type QuestionGenerationInput,
  type QuestionGenerationOutput,

  // Utilities
  validateQuestion,
  validateDynamicQuestion,
  validateQuestionGenerationInput,
  validateQuestionGenerationOutput,
  requiresOptions,
  supportsScale,
  supportsFileUpload,
} from './questionSchema';

// Blueprint schemas
export {
  // Component schemas
  moduleAssessmentSchema,
  moduleActivitySchema,
  blueprintModuleSchema,
  resourceTypeSchema,
  blueprintResourceSchema,
  timelineEntrySchema,

  // Blueprint schemas
  blueprintSchema,
  fullBlueprintSchema,

  // Generation schemas
  blueprintGenerationInputSchema,
  blueprintGenerationOutputSchema,

  // Types
  type ModuleAssessment,
  type ModuleActivity,
  type BlueprintModule,
  type BlueprintResource,
  type TimelineEntry,
  type Blueprint,
  type FullBlueprint,
  type BlueprintGenerationInput,
  type BlueprintGenerationOutput,

  // Utilities
  validateBlueprint,
  validateFullBlueprint,
  validateBlueprintGenerationInput,
  validateBlueprintGenerationOutput,
  toCanonicalBlueprint,
  calculateTotalDuration,
  getAllTopics,
  validateModuleDependencies,
  ensureModuleIds,
  ensureResourceIds,
  normalizeBlueprint,
} from './blueprintSchema';

/**
 * Schema version information
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Schema metadata
 */
export const SCHEMA_METADATA = {
  version: SCHEMA_VERSION,
  lastUpdated: '2025-01-22',
  description: 'Centralized Zod validation schemas for Polaris v3',
  compatibility: {
    aiSdk: '^5.0.0',
    zod: '^3.25.76',
  },
} as const;

// Schema utilities
export {
  // Versioning
  SchemaVersion,
  type VersionMetadata,
  detectSchemaVersion,
  addVersionMetadata,

  // Normalization
  normalizeString,
  normalizeArray,
  normalizeDate,
  normalizeQuestion,
  normalizeBlueprint as normalizeBlueprintUtil,

  // Transformation
  transformQuestionV1ToV1_1,
  transformBlueprintV1ToV1_1,
  migrateToLatest,
  batchNormalizeQuestions,

  // Validation
  validateQuestionCompleteness,
  validateBlueprintCompleteness,
  type ValidationResult,
  safeValidate,

  // Utilities
  schemasEqual,
  hashSchema,
  mergeQuestions,
  mergeBlueprints,
  getBlueprintStats,
} from './utils';
