/**
 * Blueprint Schema Validation Tests
 * Tests for Zod schema validation of blueprint_json structure
 *
 * Test Coverage:
 * - Valid blueprint validation
 * - Invalid blueprint rejection
 * - Individual section validation
 * - Edge cases and malformed data
 * - Type inference verification
 */

import { describe, it, expect } from 'vitest';
import {
  BlueprintSchema,
  BlueprintMetadataSchema,
  ModuleSchema,
  TimelinePhaseSchema,
  ResourceItemSchema,
  AssessmentSchema,
  MetricSchema,
  RiskSchema,
  validateBlueprint,
  safeValidateBlueprint,
  validateSection,
  hasMinimumBlueprintStructure,
  getBlueprintSections,
  getBlueprintMetadataSummary,
  type Blueprint,
} from '@/lib/presentation/blueprintSchema';

// ============================================================================
// Test Fixtures
// ============================================================================

const validMetadata = {
  title: 'Test Learning Blueprint',
  organization: 'Test Org',
  role: 'Developer',
  generated_at: '2025-11-14T10:00:00Z',
  version: '1.0.0',
  author: 'Test Author',
};

const validModule = {
  title: 'Module 1: Introduction',
  duration: 120,
  topics: ['Topic A', 'Topic B'],
  activities: ['Activity 1', 'Activity 2'],
  assessments: ['Quiz 1'],
};

const validTimelinePhase = {
  phase: 1,
  title: 'Phase 1: Foundation',
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  duration: '4 weeks',
  milestones: ['Milestone 1', 'Milestone 2'],
};

const validResource = {
  name: 'Official Documentation',
  type: 'documentation',
  url: 'https://example.com/docs',
  description: 'Comprehensive documentation',
};

const validBlueprint: Blueprint = {
  metadata: validMetadata,
  overview: 'This is a comprehensive learning blueprint for developers.',
  objectives: {
    displayType: 'infographic',
    objectives: ['Learn TypeScript', 'Master React', 'Build Full-Stack Apps'],
  },
  modules: {
    displayType: 'timeline',
    modules: [validModule],
    total_duration: '10 weeks',
  },
  timeline: {
    displayType: 'timeline',
    phases: [validTimelinePhase],
  },
  resources: {
    displayType: 'table',
    resources: [validResource],
  },
};

// ============================================================================
// Metadata Schema Tests
// ============================================================================

describe('BlueprintMetadataSchema', () => {
  it('should validate valid metadata', () => {
    const result = BlueprintMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should require title field', () => {
    const invalidMetadata = { ...validMetadata, title: '' };
    const result = BlueprintMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const minimalMetadata = {
      title: 'Minimal Blueprint',
      generated_at: '2025-11-14T10:00:00Z',
    };
    const result = BlueprintMetadataSchema.safeParse(minimalMetadata);
    expect(result.success).toBe(true);
  });

  it('should accept flexible date formats', () => {
    const flexibleDates = {
      ...validMetadata,
      generated_at: '2025-11-14', // Non-datetime format
    };
    const result = BlueprintMetadataSchema.safeParse(flexibleDates);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Module Schema Tests
// ============================================================================

describe('ModuleSchema', () => {
  it('should validate valid module', () => {
    const result = ModuleSchema.safeParse(validModule);
    expect(result.success).toBe(true);
  });

  it('should require title', () => {
    const invalidModule = { ...validModule, title: '' };
    const result = ModuleSchema.safeParse(invalidModule);
    expect(result.success).toBe(false);
  });

  it('should accept string duration', () => {
    const moduleWithStringDuration = { ...validModule, duration: '2 weeks' };
    const result = ModuleSchema.safeParse(moduleWithStringDuration);
    expect(result.success).toBe(true);
  });

  it('should default empty arrays for optional fields', () => {
    const minimalModule = {
      title: 'Minimal Module',
      duration: 60,
    };
    const result = ModuleSchema.safeParse(minimalModule);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topics).toEqual([]);
      expect(result.data.activities).toEqual([]);
      expect(result.data.assessments).toEqual([]);
    }
  });
});

// ============================================================================
// Timeline Phase Schema Tests
// ============================================================================

describe('TimelinePhaseSchema', () => {
  it('should validate valid timeline phase', () => {
    const result = TimelinePhaseSchema.safeParse(validTimelinePhase);
    expect(result.success).toBe(true);
  });

  it('should accept numeric phase numbers', () => {
    const numericPhase = { ...validTimelinePhase, phase: 1 };
    const result = TimelinePhaseSchema.safeParse(numericPhase);
    expect(result.success).toBe(true);
  });

  it('should accept string phase identifiers', () => {
    const stringPhase = { ...validTimelinePhase, phase: 'Phase 1' };
    const result = TimelinePhaseSchema.safeParse(stringPhase);
    expect(result.success).toBe(true);
  });

  it('should allow optional dates', () => {
    const phaseWithoutDates = {
      phase: 1,
      title: 'Undated Phase',
    };
    const result = TimelinePhaseSchema.safeParse(phaseWithoutDates);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Resource Item Schema Tests
// ============================================================================

describe('ResourceItemSchema', () => {
  it('should validate valid resource', () => {
    const result = ResourceItemSchema.safeParse(validResource);
    expect(result.success).toBe(true);
  });

  it('should accept non-URL strings for url field', () => {
    const resourceWithPath = { ...validResource, url: '/local/path/to/file' };
    const result = ResourceItemSchema.safeParse(resourceWithPath);
    expect(result.success).toBe(true);
  });

  it('should handle title/name field variations', () => {
    const resourceWithTitle = { title: 'Resource Title', type: 'video' };
    const result = ResourceItemSchema.safeParse(resourceWithTitle);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Assessment Schema Tests
// ============================================================================

describe('AssessmentSchema', () => {
  it('should validate valid assessment', () => {
    const validAssessment = {
      title: 'Final Exam',
      type: 'exam',
      description: 'Comprehensive final assessment',
      weight: 30,
      duration: 120,
      passing_score: 70,
    };
    const result = AssessmentSchema.safeParse(validAssessment);
    expect(result.success).toBe(true);
  });

  it('should allow string or number duration', () => {
    const assessmentStringDuration = {
      title: 'Quiz',
      type: 'quiz',
      duration: '30 minutes',
    };
    const result = AssessmentSchema.safeParse(assessmentStringDuration);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Metric Schema Tests
// ============================================================================

describe('MetricSchema', () => {
  it('should validate valid metric', () => {
    const validMetric = {
      name: 'Course Completion Rate',
      target: '85%',
      unit: 'percentage',
      description: 'Percentage of students completing the course',
    };
    const result = MetricSchema.safeParse(validMetric);
    expect(result.success).toBe(true);
  });

  it('should accept numeric targets', () => {
    const numericMetric = {
      name: 'Students Enrolled',
      target: 1000,
      unit: 'students',
    };
    const result = MetricSchema.safeParse(numericMetric);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Risk Schema Tests
// ============================================================================

describe('RiskSchema', () => {
  it('should validate valid risk', () => {
    const validRisk = {
      risk: 'Budget overrun',
      description: 'Project may exceed allocated budget',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Regular budget reviews and contingency planning',
    };
    const result = RiskSchema.safeParse(validRisk);
    expect(result.success).toBe(true);
  });

  it('should accept enum values for probability and impact', () => {
    const riskWithEnums = {
      risk: 'Scope creep',
      probability: 'high' as const,
      impact: 'medium' as const,
    };
    const result = RiskSchema.safeParse(riskWithEnums);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Complete Blueprint Schema Tests
// ============================================================================

describe('BlueprintSchema', () => {
  it('should validate complete valid blueprint', () => {
    const result = BlueprintSchema.safeParse(validBlueprint);
    expect(result.success).toBe(true);
  });

  it('should require metadata', () => {
    const blueprintWithoutMetadata = { ...validBlueprint };
    delete (blueprintWithoutMetadata as any).metadata;
    const result = BlueprintSchema.safeParse(blueprintWithoutMetadata);
    expect(result.success).toBe(false);
  });

  it('should accept minimal blueprint with just metadata and one section', () => {
    const minimalBlueprint = {
      metadata: validMetadata,
      overview: 'Minimal overview',
    };
    const result = BlueprintSchema.safeParse(minimalBlueprint);
    expect(result.success).toBe(true);
  });

  it('should allow custom sections via passthrough', () => {
    const blueprintWithCustomSections = {
      ...validBlueprint,
      custom_section: {
        displayType: 'markdown',
        content: 'Custom content',
      },
    };
    const result = BlueprintSchema.safeParse(blueprintWithCustomSections);
    expect(result.success).toBe(true);
  });

  it('should validate section aliases', () => {
    const blueprintWithAliases = {
      metadata: validMetadata,
      learning_objectives: {
        displayType: 'infographic' as const,
        objectives: ['Objective 1'],
      },
      learning_modules: {
        displayType: 'timeline' as const,
        modules: [validModule],
      },
    };
    const result = BlueprintSchema.safeParse(blueprintWithAliases);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Validation Helper Functions Tests
// ============================================================================

describe('validateBlueprint', () => {
  it('should return typed blueprint for valid data', () => {
    const result = validateBlueprint(validBlueprint);
    expect(result.metadata.title).toBe('Test Learning Blueprint');
    expect(result.modules?.modules).toHaveLength(1);
  });

  it('should throw ZodError for invalid data', () => {
    const invalidBlueprint = { invalid: 'data' };
    expect(() => validateBlueprint(invalidBlueprint)).toThrow();
  });
});

describe('safeValidateBlueprint', () => {
  it('should return success for valid blueprint', () => {
    const result = safeValidateBlueprint(validBlueprint);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.title).toBe('Test Learning Blueprint');
    }
  });

  it('should return error for invalid blueprint', () => {
    const invalidBlueprint = { invalid: 'data' };
    const result = safeValidateBlueprint(invalidBlueprint);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('validateSection', () => {
  it('should validate objectives section', () => {
    const section = {
      displayType: 'infographic' as const,
      objectives: ['Objective 1', 'Objective 2'],
    };
    const result = validateSection('objectives', section);
    expect(result).toBeDefined();
  });

  it('should validate modules section with alias', () => {
    const section = {
      displayType: 'timeline' as const,
      modules: [validModule],
    };
    const result = validateSection('learning_modules', section);
    expect(result).toBeDefined();
  });

  it('should validate timeline section', () => {
    const section = {
      displayType: 'timeline' as const,
      phases: [validTimelinePhase],
    };
    const result = validateSection('implementation_plan', section);
    expect(result).toBeDefined();
  });

  it('should use generic schema for unknown sections', () => {
    const section = {
      displayType: 'markdown' as const,
      content: 'Custom content',
    };
    const result = validateSection('custom_section', section);
    expect(result).toBeDefined();
  });
});

describe('hasMinimumBlueprintStructure', () => {
  it('should return true for valid blueprint', () => {
    expect(hasMinimumBlueprintStructure(validBlueprint)).toBe(true);
  });

  it('should return false for null', () => {
    expect(hasMinimumBlueprintStructure(null)).toBe(false);
  });

  it('should return false for non-object', () => {
    expect(hasMinimumBlueprintStructure('not an object')).toBe(false);
  });

  it('should return false for object without metadata', () => {
    expect(hasMinimumBlueprintStructure({ some: 'data' })).toBe(false);
  });

  it('should return false for metadata without title', () => {
    expect(hasMinimumBlueprintStructure({ metadata: { organization: 'Test' } })).toBe(false);
  });

  it('should return false for metadata without content sections', () => {
    expect(hasMinimumBlueprintStructure({ metadata: { title: 'Test' } })).toBe(false);
  });

  it('should return true for minimal valid structure', () => {
    const minimal = {
      metadata: { title: 'Test' },
      overview: 'Content',
    };
    expect(hasMinimumBlueprintStructure(minimal)).toBe(true);
  });
});

describe('getBlueprintSections', () => {
  it('should return all section keys excluding metadata', () => {
    const sections = getBlueprintSections(validBlueprint);
    expect(sections).toContain('overview');
    expect(sections).toContain('objectives');
    expect(sections).toContain('modules');
    expect(sections).toContain('timeline');
    expect(sections).toContain('resources');
    expect(sections).not.toContain('metadata');
  });

  it('should exclude internal fields starting with underscore', () => {
    const blueprintWithInternal = {
      ...validBlueprint,
      _internal: 'should be excluded',
    } as Blueprint;
    const sections = getBlueprintSections(blueprintWithInternal);
    expect(sections).not.toContain('_internal');
  });
});

describe('getBlueprintMetadataSummary', () => {
  it('should return metadata summary with section count', () => {
    const summary = getBlueprintMetadataSummary(validBlueprint);
    expect(summary.title).toBe('Test Learning Blueprint');
    expect(summary.generated_at).toBe('2025-11-14T10:00:00Z');
    expect(summary.sectionCount).toBeGreaterThan(0);
    expect(summary.sections).toContain('overview');
  });

  it('should count all content sections', () => {
    const summary = getBlueprintMetadataSummary(validBlueprint);
    const expectedSections = ['overview', 'objectives', 'modules', 'timeline', 'resources'];
    expect(summary.sectionCount).toBe(expectedSections.length);
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty arrays gracefully', () => {
    const blueprintWithEmptyArrays = {
      metadata: validMetadata,
      modules: {
        displayType: 'timeline' as const,
        modules: [],
      },
    };
    const result = BlueprintSchema.safeParse(blueprintWithEmptyArrays);
    expect(result.success).toBe(true);
  });

  it('should handle null values in optional fields', () => {
    const blueprintWithNulls = {
      metadata: { ...validMetadata, organization: null },
      overview: null,
    };
    const result = BlueprintSchema.safeParse(blueprintWithNulls);
    expect(result.success).toBe(true);
  });

  it('should reject negative duration in modules', () => {
    const moduleWithNegativeDuration = {
      ...validModule,
      duration: -10,
    };
    const result = ModuleSchema.safeParse(moduleWithNegativeDuration);
    expect(result.success).toBe(false);
  });

  it('should handle deeply nested structures', () => {
    const complexBlueprint = {
      metadata: validMetadata,
      modules: {
        displayType: 'timeline' as const,
        modules: Array(50).fill(validModule), // Large array
      },
    };
    const result = BlueprintSchema.safeParse(complexBlueprint);
    expect(result.success).toBe(true);
  });

  it('should validate mixed data types in arrays', () => {
    const invalidObjectives = {
      displayType: 'infographic' as const,
      objectives: ['String objective', 123], // Mixed types
    };
    // Should throw error due to mixed types
    expect(() => validateSection('objectives', invalidObjectives)).toThrow();
  });
});

// ============================================================================
// Type Inference Tests
// ============================================================================

describe('Type Inference', () => {
  it('should infer correct types from schemas', () => {
    type InferredBlueprint = typeof validBlueprint;
    const typed: InferredBlueprint = validBlueprint;
    expect(typed.metadata.title).toBe('Test Learning Blueprint');
  });

  it('should provide autocomplete for known section types', () => {
    const blueprint = validateBlueprint(validBlueprint);
    // TypeScript should autocomplete these properties
    expect(blueprint.metadata).toBeDefined();
    expect(blueprint.objectives).toBeDefined();
    expect(blueprint.modules).toBeDefined();
  });
});
