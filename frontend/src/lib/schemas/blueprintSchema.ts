/**
 * Centralized Blueprint Schema Module
 *
 * Consolidates all blueprint-related validation logic from across the codebase.
 * Provides consistent validation for blueprint structure, modules, resources,
 * and timeline compatible with AI SDK response formats.
 *
 * @module lib/schemas/blueprintSchema
 */

import { z } from 'zod';

/**
 * Module assessment schema
 */
export const moduleAssessmentSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().min(0).max(100).optional(),
});

export type ModuleAssessment = z.infer<typeof moduleAssessmentSchema>;

/**
 * Module activity schema
 */
export const moduleActivitySchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  duration: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

export type ModuleActivity = z.infer<typeof moduleActivitySchema>;

/**
 * Blueprint module schema
 */
export const blueprintModuleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Module title is required'),
  overview: z.string().optional(),
  duration: z.number().int().min(0, 'Duration must be non-negative'),
  topics: z.array(z.string().min(1)).min(1, 'At least one topic is required'),
  activities: z
    .array(z.union([z.string().min(1), moduleActivitySchema]))
    .min(1, 'At least one activity is required'),
  assessments: z
    .array(z.union([z.string().min(1), moduleAssessmentSchema]))
    .min(1, 'At least one assessment is required'),
  learningObjectives: z.array(z.string().min(1)).optional(),
  prerequisites: z.array(z.string()).optional(),
  order: z.number().int().min(0).optional(),
});

export type BlueprintModule = z.infer<typeof blueprintModuleSchema>;

/**
 * Resource types
 */
export const resourceTypeSchema = z.enum([
  'article',
  'video',
  'book',
  'course',
  'documentation',
  'tool',
  'exercise',
  'project',
  'other',
]);

/**
 * Blueprint resource schema
 */
export const blueprintResourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Resource name is required'),
  type: resourceTypeSchema,
  url: z.string().url('Must be a valid URL').optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type BlueprintResource = z.infer<typeof blueprintResourceSchema>;

/**
 * Timeline entry schema
 */
export const timelineEntrySchema = z.object({
  phase: z.string().min(1),
  duration: z.string().min(1),
  description: z.string().optional(),
  milestones: z.array(z.string()).optional(),
});

export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

/**
 * Core blueprint schema (canonical format)
 */
export const blueprintSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Blueprint title is required'),
  overview: z.string().min(1, 'Blueprint overview is required'),
  description: z.string().optional(),
  learningObjectives: z
    .array(z.string().min(1))
    .min(1, 'At least one learning objective is required'),
  modules: z.array(blueprintModuleSchema).min(1, 'At least one module is required'),
  timeline: z.union([z.record(z.string(), z.string()), z.array(timelineEntrySchema)]).optional(),
  resources: z.array(blueprintResourceSchema).optional(),
  prerequisites: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  version: z.string().default('1.0'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type Blueprint = z.infer<typeof blueprintSchema>;

/**
 * Full blueprint schema (extended format with additional fields)
 */
export const fullBlueprintSchema = blueprintSchema.extend({
  modules: z
    .array(
      blueprintModuleSchema.extend({
        content: z
          .array(
            z.object({
              type: z.enum(['text', 'video', 'exercise', 'quiz', 'reading', 'discussion']),
              title: z.string().min(1),
              content: z.string().optional(),
              duration: z.number().int().min(0).optional(),
              order: z.number().int().min(0).optional(),
            })
          )
          .optional(),
        quizzes: z
          .array(
            z.object({
              id: z.string().optional(),
              title: z.string().min(1),
              questions: z.array(z.string()).min(1),
              passingScore: z.number().min(0).max(100).optional(),
              timeLimit: z.number().int().min(0).optional(),
            })
          )
          .optional(),
      })
    )
    .min(1),
  assessmentStrategy: z
    .object({
      formative: z.array(z.string()).optional(),
      summative: z.array(z.string()).optional(),
      passingCriteria: z.string().optional(),
    })
    .optional(),
  pathways: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        moduleIds: z.array(z.string()).min(1),
      })
    )
    .optional(),
});

export type FullBlueprint = z.infer<typeof fullBlueprintSchema>;

/**
 * Blueprint generation input schema (for AI SDK)
 */
export const blueprintGenerationInputSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  targetAudience: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration: z.number().int().min(1).optional(), // in hours
  moduleCount: z.number().int().min(1).max(20).default(5),
  includeResources: z.boolean().default(true),
  includeTimeline: z.boolean().default(true),
  includeAssessments: z.boolean().default(true),
  learningObjectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  context: z.string().optional(),
});

export type BlueprintGenerationInput = z.infer<typeof blueprintGenerationInputSchema>;

/**
 * Blueprint generation output schema (for AI SDK response)
 */
export const blueprintGenerationOutputSchema = z.object({
  blueprint: blueprintSchema,
  metadata: z
    .object({
      topic: z.string(),
      difficulty: z.string().optional(),
      estimatedDuration: z.number().optional(),
      generatedAt: z.number(),
      version: z.string().default('1.0'),
    })
    .optional(),
});

export type BlueprintGenerationOutput = z.infer<typeof blueprintGenerationOutputSchema>;

/**
 * Utility functions for blueprint validation
 */

/**
 * Validate and normalize a blueprint
 */
export function validateBlueprint(data: unknown): Blueprint {
  return blueprintSchema.parse(data);
}

/**
 * Validate and normalize a full blueprint
 */
export function validateFullBlueprint(data: unknown): FullBlueprint {
  return fullBlueprintSchema.parse(data);
}

/**
 * Validate blueprint generation input
 */
export function validateBlueprintGenerationInput(data: unknown): BlueprintGenerationInput {
  return blueprintGenerationInputSchema.parse(data);
}

/**
 * Validate blueprint generation output from AI SDK
 */
export function validateBlueprintGenerationOutput(data: unknown): BlueprintGenerationOutput {
  return blueprintGenerationOutputSchema.parse(data);
}

/**
 * Transform full blueprint to canonical blueprint
 */
export function toCanonicalBlueprint(fullBlueprint: FullBlueprint): Blueprint {
  const { modules, assessmentStrategy, pathways, ...rest } = fullBlueprint;

  return blueprintSchema.parse({
    ...rest,
    modules: modules.map(({ content, quizzes, ...module }) => ({
      ...module,
      // Merge content and quizzes into activities
      activities: [
        ...(module.activities || []),
        ...(content?.map((c) => ({
          title: c.title,
          type: c.type,
          duration: c.duration,
          description: c.content,
        })) || []),
      ],
      // Merge quizzes into assessments
      assessments: [
        ...(module.assessments || []),
        ...(quizzes?.map((q) => ({
          type: 'quiz',
          description: q.title,
          weight: q.passingScore,
        })) || []),
      ],
    })),
    metadata: {
      ...(rest.metadata || {}),
      hasAssessmentStrategy: !!assessmentStrategy,
      hasPathways: !!pathways,
      pathwayCount: pathways?.length || 0,
    },
  });
}

/**
 * Calculate total blueprint duration
 */
export function calculateTotalDuration(blueprint: Blueprint): number {
  return blueprint.modules.reduce((total, module) => total + module.duration, 0);
}

/**
 * Get all unique topics from blueprint modules
 */
export function getAllTopics(blueprint: Blueprint): string[] {
  const topics = new Set<string>();
  blueprint.modules.forEach((module) => {
    module.topics.forEach((topic) => topics.add(topic));
  });
  return Array.from(topics);
}

/**
 * Validate module dependencies (prerequisites)
 */
export function validateModuleDependencies(blueprint: Blueprint): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const moduleIds = new Set(blueprint.modules.map((m) => m.id).filter(Boolean));

  blueprint.modules.forEach((module, index) => {
    if (module.prerequisites) {
      module.prerequisites.forEach((prereqId) => {
        if (!moduleIds.has(prereqId)) {
          errors.push(
            `Module "${module.title}" (index ${index}) references unknown prerequisite: ${prereqId}`
          );
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Auto-generate module IDs if missing
 */
export function ensureModuleIds(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((module, index) => ({
      ...module,
      id: module.id || `module_${index + 1}`,
    })),
  };
}

/**
 * Auto-generate resource IDs if missing
 */
export function ensureResourceIds(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    resources: blueprint.resources?.map((resource, index) => ({
      ...resource,
      id: resource.id || `resource_${index + 1}`,
    })),
  };
}

/**
 * Normalize blueprint (ensure IDs, timestamps, etc.)
 */
export function normalizeBlueprint(blueprint: Blueprint): Blueprint {
  const normalized = ensureModuleIds(ensureResourceIds(blueprint));

  return {
    ...normalized,
    id: normalized.id || `blueprint_${Date.now()}`,
    createdAt: normalized.createdAt || Date.now(),
    updatedAt: Date.now(),
    version: normalized.version || '1.0',
  };
}
