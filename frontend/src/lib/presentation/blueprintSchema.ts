/**
 * Blueprint Zod Validation Schemas
 * Comprehensive validation for blueprint_json structure before parsing to presentation slides
 *
 * Created for Task 4.1: Create Blueprint Schema Validation with Zod
 */

import { z } from 'zod';

// ============================================================================
// Base Types
// ============================================================================

/**
 * Valid display types for blueprint sections
 */
export const DisplayTypeSchema = z.enum(['infographic', 'timeline', 'chart', 'table', 'markdown']);

/**
 * Blueprint metadata section
 * Required fields for all blueprints
 */
export const BlueprintMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  organization: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  generated_at: z.string().datetime().or(z.string()), // Allow flexible date formats
  version: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// ============================================================================
// Module and Learning Content Schemas
// ============================================================================

/**
 * Learning module structure
 * Represents a single module in the learning blueprint
 */
export const ModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  duration: z.number().positive('Duration must be positive').or(z.string()), // Allow "2 weeks" format
  topics: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  assessments: z.array(z.string()).default([]),
  objectives: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  order: z.number().optional(),
  description: z.string().optional(),
});

/**
 * Timeline phase structure
 * Used in timeline sections
 */
export const TimelinePhaseSchema = z.object({
  phase: z.string().or(z.number()),
  title: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration: z.string().or(z.number()).optional(),
  milestones: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'blocked']).optional(),
});

/**
 * Resource item structure
 * Learning resources, tools, documents, etc.
 */
export const ResourceItemSchema = z
  .object({
    name: z.string().optional(),
    title: z.string().optional(),
    type: z.string(),
    url: z.string().url().optional().or(z.string()), // Allow non-URL strings
    description: z.string().optional(),
    category: z.string().optional(),
    format: z.string().optional(),
  })
  .refine((data) => data.name || data.title, {
    message: 'Either name or title must be provided',
  });

/**
 * Assessment structure
 * Quizzes, exams, projects, etc.
 */
export const AssessmentSchema = z.object({
  title: z.string(),
  type: z.string(),
  description: z.string().optional(),
  weight: z.number().optional(),
  duration: z.string().or(z.number()).optional(),
  passing_score: z.number().optional(),
  questions: z.array(z.string()).optional(),
});

/**
 * KPI/Metric structure
 * Key performance indicators and metrics
 */
export const MetricSchema = z.object({
  name: z.string(),
  target: z.string().or(z.number()),
  unit: z.string().optional(),
  description: z.string().optional(),
  current: z.string().or(z.number()).optional(),
  baseline: z.string().or(z.number()).optional(),
});

/**
 * Risk item structure
 * Project risks and mitigation strategies
 */
export const RiskSchema = z.object({
  risk: z.string(),
  description: z.string().optional(),
  probability: z.enum(['low', 'medium', 'high']).or(z.string()),
  impact: z.enum(['low', 'medium', 'high']).or(z.string()),
  mitigation: z.string().optional(),
  owner: z.string().optional(),
});

// ============================================================================
// Section Schemas (Content Sections)
// ============================================================================

/**
 * Generic section schema with flexible content
 * Used for sections that don't match specific types
 */
export const GenericSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('markdown'),
    content: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  })
  .passthrough(); // Allow additional fields

/**
 * Objectives section schema
 */
export const ObjectivesSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('infographic'),
    objectives: z.array(z.string()).or(
      z.array(
        z.object({
          objective: z.string(),
          description: z.string().optional(),
        })
      )
    ),
    learning_outcomes: z.array(z.string()).optional(),
    success_criteria: z.array(z.string()).optional(),
  })
  .passthrough();

/**
 * Modules section schema
 */
export const ModulesSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('timeline'),
    modules: z.array(ModuleSchema),
    total_duration: z.string().or(z.number()).optional(),
    structure: z.string().optional(),
  })
  .passthrough();

/**
 * Timeline/Implementation section schema
 */
export const TimelineSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('timeline'),
    phases: z.array(TimelinePhaseSchema).optional(),
    timeline: z.array(TimelinePhaseSchema).optional(), // Alias for phases
    milestones: z.array(z.string()).optional(),
    duration: z.string().or(z.number()).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .passthrough();

/**
 * Resources section schema
 */
export const ResourcesSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('table'),
    resources: z.array(ResourceItemSchema),
    categories: z.array(z.string()).optional(),
    total_count: z.number().optional(),
  })
  .passthrough();

/**
 * Assessment section schema
 */
export const AssessmentsSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('infographic'),
    assessments: z.array(AssessmentSchema),
    grading_criteria: z.string().optional(),
    passing_requirements: z.string().optional(),
  })
  .passthrough();

/**
 * Metrics/KPIs section schema
 */
export const MetricsSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('infographic'),
    metrics: z.array(MetricSchema).optional(),
    kpis: z.array(MetricSchema).optional(), // Alias
    tracking_frequency: z.string().optional(),
    reporting: z.string().optional(),
  })
  .passthrough();

/**
 * Risks section schema
 */
export const RisksSectionSchema = z
  .object({
    displayType: DisplayTypeSchema.default('table'),
    risks: z.array(RiskSchema),
    mitigation_strategy: z.string().optional(),
    risk_tolerance: z.string().optional(),
  })
  .passthrough();

// ============================================================================
// Main Blueprint Schema
// ============================================================================

/**
 * Complete blueprint schema
 * Validates entire blueprint_json structure
 */
export const BlueprintSchema = z
  .object({
    // Required metadata
    metadata: BlueprintMetadataSchema,

    // Optional common sections (section names may vary)
    overview: z.string().optional().nullable(),
    executive_summary: z.string().optional().nullable(),

    // Structured sections (validated with specific schemas)
    objectives: ObjectivesSectionSchema.optional(),
    learning_objectives: ObjectivesSectionSchema.optional(), // Alias

    modules: ModulesSectionSchema.optional(),
    learning_modules: ModulesSectionSchema.optional(), // Alias
    curriculum: ModulesSectionSchema.optional(), // Alias

    timeline: TimelineSectionSchema.optional(),
    implementation_plan: TimelineSectionSchema.optional(), // Alias
    schedule: TimelineSectionSchema.optional(), // Alias

    resources: ResourcesSectionSchema.optional(),
    learning_resources: ResourcesSectionSchema.optional(), // Alias

    assessments: AssessmentsSectionSchema.optional(),
    evaluation: AssessmentsSectionSchema.optional(), // Alias

    metrics: MetricsSectionSchema.optional(),
    kpis: MetricsSectionSchema.optional(), // Alias
    success_metrics: MetricsSectionSchema.optional(), // Alias

    risks: RisksSectionSchema.optional(),
    risk_management: RisksSectionSchema.optional(), // Alias
  })
  .passthrough(); // Allow additional custom sections

// ============================================================================
// Exported Types (Runtime Type Inference)
// ============================================================================

export type DisplayType = z.infer<typeof DisplayTypeSchema>;
export type BlueprintMetadata = z.infer<typeof BlueprintMetadataSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type TimelinePhase = z.infer<typeof TimelinePhaseSchema>;
export type ResourceItem = z.infer<typeof ResourceItemSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;

// Section types
export type ObjectivesSection = z.infer<typeof ObjectivesSectionSchema>;
export type ModulesSection = z.infer<typeof ModulesSectionSchema>;
export type TimelineSection = z.infer<typeof TimelineSectionSchema>;
export type ResourcesSection = z.infer<typeof ResourcesSectionSchema>;
export type AssessmentsSection = z.infer<typeof AssessmentsSectionSchema>;
export type MetricsSection = z.infer<typeof MetricsSectionSchema>;
export type RisksSection = z.infer<typeof RisksSectionSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate blueprint data with detailed error messages
 * @param data - Raw blueprint_json data
 * @returns Validated and typed blueprint
 * @throws ZodError with detailed validation errors
 */
export function validateBlueprint(data: unknown): Blueprint {
  return BlueprintSchema.parse(data);
}

/**
 * Safe blueprint validation that returns result with errors
 * @param data - Raw blueprint_json data
 * @returns SafeParseReturnType with success/error info
 */
export function safeValidateBlueprint(data: unknown) {
  return BlueprintSchema.safeParse(data);
}

/**
 * Validate individual section with specific schema
 * @param sectionName - Name of the section
 * @param data - Section data
 * @returns Validated section or null if unknown section type
 */
export function validateSection(sectionName: string, data: unknown): unknown {
  const sectionKey = sectionName.toLowerCase();

  // Map section names to schemas
  if (sectionKey.includes('objective')) {
    return ObjectivesSectionSchema.parse(data);
  }
  if (sectionKey.includes('module') || sectionKey.includes('curriculum')) {
    return ModulesSectionSchema.parse(data);
  }
  if (
    sectionKey.includes('timeline') ||
    sectionKey.includes('implementation') ||
    sectionKey.includes('schedule')
  ) {
    return TimelineSectionSchema.parse(data);
  }
  if (sectionKey.includes('resource')) {
    return ResourcesSectionSchema.parse(data);
  }
  if (sectionKey.includes('assessment') || sectionKey.includes('evaluation')) {
    return AssessmentsSectionSchema.parse(data);
  }
  if (sectionKey.includes('metric') || sectionKey.includes('kpi')) {
    return MetricsSectionSchema.parse(data);
  }
  if (sectionKey.includes('risk')) {
    return RisksSectionSchema.parse(data);
  }

  // Default: use generic section schema
  return GenericSectionSchema.parse(data);
}

/**
 * Check if blueprint has required minimum structure
 * @param data - Partial blueprint data
 * @returns true if valid minimum structure
 */
export function hasMinimumBlueprintStructure(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const blueprint = data as Record<string, unknown>;

  // Must have metadata with title
  if (!blueprint.metadata || typeof blueprint.metadata !== 'object') {
    return false;
  }

  const metadata = blueprint.metadata as Record<string, unknown>;
  if (!metadata.title || typeof metadata.title !== 'string') {
    return false;
  }

  // Must have at least one content section
  const contentKeys = Object.keys(blueprint).filter(
    (key) => key !== 'metadata' && !key.startsWith('_')
  );

  return contentKeys.length > 0;
}

/**
 * Extract all section keys from blueprint (excluding metadata and internal fields)
 * @param blueprint - Validated blueprint
 * @returns Array of section keys
 */
export function getBlueprintSections(blueprint: Blueprint): string[] {
  return Object.keys(blueprint).filter((key) => key !== 'metadata' && !key.startsWith('_'));
}

/**
 * Get metadata summary from blueprint
 * @param blueprint - Validated blueprint
 * @returns Metadata summary object
 */
export function getBlueprintMetadataSummary(blueprint: Blueprint): {
  title: string;
  generated_at: string;
  sectionCount: number;
  sections: string[];
} {
  return {
    title: blueprint.metadata.title,
    generated_at: blueprint.metadata.generated_at,
    sectionCount: getBlueprintSections(blueprint).length,
    sections: getBlueprintSections(blueprint),
  };
}
