/**
 * Schema Utilities Module
 *
 * Provides versioning, normalization, transformation, and validation utilities
 * for centralized schemas. Includes backward compatibility support and
 * runtime version negotiation.
 *
 * @module lib/schemas/utils
 */

import { z } from 'zod';
import {
  type Blueprint,
  type Question,
  blueprintSchema,
  questionSchema,
  requiresOptions,
  supportsScale,
} from './index';

/**
 * Schema version enum
 */
export enum SchemaVersion {
  V1_0 = '1.0',
  V1_1 = '1.1',
  V2_0 = '2.0',
}

/**
 * Version metadata interface
 */
export interface VersionMetadata {
  version: SchemaVersion;
  createdAt: number;
  migratedFrom?: SchemaVersion;
  migrationDate?: number;
}

/**
 * Detect schema version from data
 */
export function detectSchemaVersion(data: unknown): SchemaVersion {
  if (typeof data !== 'object' || data === null) {
    return SchemaVersion.V1_0;
  }

  const obj = data as Record<string, unknown>;

  // Check for version field
  if (typeof obj.version === 'string') {
    if (obj.version.startsWith('2.')) return SchemaVersion.V2_0;
    if (obj.version.startsWith('1.1')) return SchemaVersion.V1_1;
    return SchemaVersion.V1_0;
  }

  // Check for v2-specific fields
  if ('metadata' in obj && typeof obj.metadata === 'object') {
    const metadata = obj.metadata as Record<string, unknown>;
    if ('schemaVersion' in metadata) {
      return SchemaVersion.V2_0;
    }
  }

  // Default to v1.0
  return SchemaVersion.V1_0;
}

/**
 * Add version metadata to data
 */
export function addVersionMetadata<T extends Record<string, unknown>>(
  data: T,
  version: SchemaVersion = SchemaVersion.V1_0
): T & { version: string; versionMetadata: VersionMetadata } {
  return {
    ...data,
    version,
    versionMetadata: {
      version,
      createdAt: Date.now(),
    },
  };
}

/**
 * Normalize string casing (convert to lowercase, trim)
 */
export function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Normalize array by removing duplicates and empty strings
 */
export function normalizeArray<T>(arr: T[]): T[] {
  return Array.from(
    new Set(
      arr.filter((item) => {
        if (typeof item === 'string') {
          return item.trim().length > 0;
        }
        return item != null;
      })
    )
  );
}

/**
 * Normalize date to ISO string
 */
export function normalizeDate(date: Date | string | number): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (typeof date === 'number') {
    return new Date(date).toISOString();
  }
  return new Date(date).toISOString();
}

/**
 * Normalize question data
 */
export function normalizeQuestion(question: Question): Question {
  const normalized: Question = {
    ...question,
    id: question.id.trim(),
    question: question.question.trim(),
  };

  // Normalize options if present (deduplicate by value)
  if (normalized.options) {
    const seen = new Set<string>();
    normalized.options = normalized.options.filter((opt) => {
      if (seen.has(opt.value)) {
        return false;
      }
      seen.add(opt.value);
      return true;
    });
  }

  // Ensure required field has a value
  if (normalized.required === undefined) {
    normalized.required = false;
  }

  // Remove empty metadata
  if (normalized.metadata && Object.keys(normalized.metadata).length === 0) {
    delete normalized.metadata;
  }

  return normalized;
}

/**
 * Normalize blueprint data
 */
export function normalizeBlueprint(blueprint: Blueprint): Blueprint {
  const normalized: Blueprint = {
    ...blueprint,
    title: blueprint.title.trim(),
    overview: blueprint.overview.trim(),
    learningObjectives: normalizeArray(blueprint.learningObjectives),
  };

  // Normalize modules
  normalized.modules = blueprint.modules.map((module) => ({
    ...module,
    title: module.title.trim(),
    topics: normalizeArray(module.topics),
    activities: normalizeArray(module.activities.map((a) => (typeof a === 'string' ? a : a.title))),
    assessments: normalizeArray(
      module.assessments.map((a) => (typeof a === 'string' ? a : a.description))
    ),
  }));

  // Normalize resources if present
  if (normalized.resources) {
    normalized.resources = normalized.resources.map((resource) => ({
      ...resource,
      name: resource.name.trim(),
    }));
  }

  // Remove empty metadata
  if (normalized.metadata && Object.keys(normalized.metadata).length === 0) {
    delete normalized.metadata;
  }

  return normalized;
}

/**
 * Transform question from v1.0 to v1.1 (adds metadata support)
 */
export function transformQuestionV1ToV1_1(question: Question): Question {
  return {
    ...question,
    metadata: {
      ...(question.metadata || {}),
      migratedFrom: SchemaVersion.V1_0,
      migrationDate: Date.now(),
    },
  };
}

/**
 * Transform blueprint from v1.0 to v1.1 (adds tags and difficulty)
 */
export function transformBlueprintV1ToV1_1(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    tags: blueprint.tags || [],
    difficulty: blueprint.difficulty || 'intermediate',
    metadata: {
      ...(blueprint.metadata || {}),
      migratedFrom: SchemaVersion.V1_0,
      migrationDate: Date.now(),
    },
  };
}

/**
 * Validate and transform data to latest schema version
 */
export function migrateToLatest<T extends 'question' | 'blueprint'>(
  type: T,
  data: unknown
): T extends 'question' ? Question : Blueprint {
  const version = detectSchemaVersion(data);

  if (type === 'question') {
    let question = questionSchema.parse(data);

    if (version === SchemaVersion.V1_0) {
      question = transformQuestionV1ToV1_1(question);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return normalizeQuestion(question) as any;
  } else {
    let blueprint = blueprintSchema.parse(data);

    if (version === SchemaVersion.V1_0) {
      blueprint = transformBlueprintV1ToV1_1(blueprint);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return normalizeBlueprint(blueprint) as any;
  }
}

/**
 * Batch validate and normalize multiple questions
 */
export function batchNormalizeQuestions(questions: unknown[]): Question[] {
  return questions.map((q) => {
    try {
      return migrateToLatest('question', q);
    } catch (error) {
      console.warn('Failed to normalize question:', error);
      throw error;
    }
  });
}

/**
 * Validate question has required fields based on type
 */
export function validateQuestionCompleteness(question: Question): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if question type requires options
  if (requiresOptions(question.type) && (!question.options || question.options.length === 0)) {
    errors.push(`Question type "${question.type}" requires options`);
  }

  // Check if question type requires scale config
  if (supportsScale(question.type) && !question.scaleConfig) {
    errors.push(`Question type "${question.type}" requires scale configuration`);
  }

  // Check scale config validity
  if (question.scaleConfig) {
    if (question.scaleConfig.min >= question.scaleConfig.max) {
      errors.push('Scale minimum must be less than maximum');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate blueprint completeness
 */
export function validateBlueprintCompleteness(blueprint: Blueprint): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check modules
  if (blueprint.modules.length === 0) {
    errors.push('Blueprint must have at least one module');
  }

  // Check learning objectives
  if (blueprint.learningObjectives.length === 0) {
    errors.push('Blueprint must have at least one learning objective');
  }

  // Check module completeness
  blueprint.modules.forEach((module, index) => {
    if (module.topics.length === 0) {
      errors.push(`Module ${index + 1} ("${module.title}") must have at least one topic`);
    }
    if (module.activities.length === 0) {
      errors.push(`Module ${index + 1} ("${module.title}") must have at least one activity`);
    }
    if (module.assessments.length === 0) {
      errors.push(`Module ${index + 1} ("${module.title}") must have at least one assessment`);
    }
    if (module.duration <= 0) {
      warnings.push(`Module ${index + 1} ("${module.title}") has zero or negative duration`);
    }
  });

  // Check resources
  if (!blueprint.resources || blueprint.resources.length === 0) {
    warnings.push('Blueprint has no resources');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Compare two schemas for equality (deep comparison)
 */
export function schemasEqual(schema1: unknown, schema2: unknown): boolean {
  return JSON.stringify(schema1) === JSON.stringify(schema2);
}

/**
 * Create a hash of schema data for caching/comparison
 */
export function hashSchema(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Schema validation result with detailed error information
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    path?: string[];
    issues?: Array<{
      path: string[];
      message: string;
      code: string;
    }>;
  };
}

/**
 * Safe schema validation with detailed error handling
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: result.error.message,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
        code: issue.code,
      })),
    },
  };
}

/**
 * Merge two question objects (useful for updates)
 */
export function mergeQuestions(base: Question, updates: Partial<Question>): Question {
  const merged = { ...base, ...updates };

  // Merge nested objects properly
  if (updates.scaleConfig && base.scaleConfig) {
    merged.scaleConfig = { ...base.scaleConfig, ...updates.scaleConfig };
  }

  if (updates.metadata && base.metadata) {
    merged.metadata = { ...base.metadata, ...updates.metadata };
  }

  return normalizeQuestion(merged);
}

/**
 * Merge two blueprint objects (useful for updates)
 */
export function mergeBlueprints(base: Blueprint, updates: Partial<Blueprint>): Blueprint {
  const merged = { ...base, ...updates };

  // Merge nested arrays properly
  if (updates.modules) {
    merged.modules = updates.modules;
  } else {
    merged.modules = base.modules;
  }

  if (updates.resources) {
    merged.resources = updates.resources;
  } else if (base.resources) {
    merged.resources = base.resources;
  }

  if (updates.metadata && base.metadata) {
    merged.metadata = { ...base.metadata, ...updates.metadata };
  }

  return normalizeBlueprint(merged);
}

/**
 * Extract summary statistics from blueprint
 */
export function getBlueprintStats(blueprint: Blueprint): {
  totalModules: number;
  totalTopics: number;
  totalActivities: number;
  totalAssessments: number;
  totalDuration: number;
  totalResources: number;
  averageDurationPerModule: number;
} {
  const totalTopics = blueprint.modules.reduce((sum, module) => sum + module.topics.length, 0);

  const totalActivities = blueprint.modules.reduce(
    (sum, module) => sum + module.activities.length,
    0
  );

  const totalAssessments = blueprint.modules.reduce(
    (sum, module) => sum + module.assessments.length,
    0
  );

  const totalDuration = blueprint.modules.reduce((sum, module) => sum + module.duration, 0);

  return {
    totalModules: blueprint.modules.length,
    totalTopics,
    totalActivities,
    totalAssessments,
    totalDuration,
    totalResources: blueprint.resources?.length || 0,
    averageDurationPerModule: totalDuration / blueprint.modules.length,
  };
}
