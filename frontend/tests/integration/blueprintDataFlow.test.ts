/**
 * Integration Tests for Blueprint Data Flow
 * Tests the complete pipeline from question generation → answer submission → blueprint generation → display
 */

import { describe, it, expect } from 'vitest';
import {
  validateBlueprintStructure,
  normalizeBlueprintStructure,
  parseAndValidateJSON,
} from '@/lib/claude/validation';

describe('Blueprint Generation and Validation', () => {
  describe('JSON Parsing', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify({
        metadata: {
          title: 'Test Blueprint',
          organization: 'Test Org',
          role: 'Manager',
          generated_at: new Date().toISOString(),
        },
        executive_summary: {
          content: 'Test content',
          displayType: 'markdown',
        },
      });

      const parsed = parseAndValidateJSON(json);
      expect(parsed).toBeDefined();
      expect(parsed.metadata.title).toBe('Test Blueprint');
    });

    it('should strip markdown code fences', () => {
      const json = `\`\`\`json
{
  "metadata": {
    "title": "Test",
    "organization": "Org",
    "role": "Role",
    "generated_at": "${new Date().toISOString()}"
  },
  "summary": {
    "content": "Test",
    "displayType": "markdown"
  }
}
\`\`\``;

      const parsed = parseAndValidateJSON(json);
      expect(parsed).toBeDefined();
      expect(parsed.metadata.title).toBe('Test');
    });

    it('should throw on invalid JSON', () => {
      const invalidJson = '{ invalid json }';

      expect(() => parseAndValidateJSON(invalidJson)).toThrow();
    });
  });

  describe('Blueprint Structure Validation', () => {
    it('should validate complete blueprint with all required fields', () => {
      const blueprint = {
        metadata: {
          title: 'Complete Blueprint',
          organization: 'Acme Corp',
          role: 'L&D Manager',
          generated_at: new Date().toISOString(),
        },
        executive_summary: {
          content: 'Executive summary content',
          displayType: 'markdown',
        },
        learning_objectives: {
          objectives: [
            {
              id: 'obj1',
              title: 'Objective 1',
              description: 'Description',
              metric: 'Completion rate',
              baseline: '0%',
              target: '85%',
              due_date: '2025-12-31',
            },
          ],
          displayType: 'infographic',
        },
      };

      expect(() => validateBlueprintStructure(blueprint)).not.toThrow();
    });

    it('should throw if metadata is missing', () => {
      const blueprint = {
        executive_summary: {
          content: 'Summary',
          displayType: 'markdown',
        },
      };

      expect(() => validateBlueprintStructure(blueprint)).toThrow('missing required metadata');
    });

    it('should throw if required metadata fields are missing', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          // Missing: organization, role, generated_at
        },
        summary: {
          content: 'Test',
          displayType: 'markdown',
        },
      };

      expect(() => validateBlueprintStructure(blueprint)).toThrow();
    });

    it('should not throw if sections are missing displayType (will be normalized)', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        summary: {
          content: 'Test content',
          // displayType missing - will be added during normalization
        },
      };

      // Validation should not fail
      expect(() => validateBlueprintStructure(blueprint)).not.toThrow();
    });
  });

  describe('Blueprint Normalization', () => {
    it('should add default displayType to sections missing it', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        executive_summary: {
          content: 'Summary text',
          // No displayType
        },
        learning_objectives: {
          objectives: [],
          // No displayType
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.executive_summary.displayType).toBe('markdown');
      // learning_objectives should be inferred as infographic
      expect(normalized.learning_objectives.displayType).toBe('infographic');
    });

    it('should infer timeline displayType for temporal data', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        implementation_timeline: {
          phases: [
            {
              phase: 'Design',
              start_date: '2025-01-01',
              end_date: '2025-02-01',
              milestones: ['Milestone 1'],
            },
          ],
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.implementation_timeline.displayType).toBe('timeline');
    });

    it('should infer table displayType for resource/budget data', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        resources: {
          human_resources: [
            { role: 'Designer', fte: 0.5, duration: '3 months' },
            { role: 'Developer', fte: 1.0, duration: '6 months' },
          ],
        },
        risk_mitigation: {
          risks: [
            {
              risk: 'Low engagement',
              probability: 'Medium',
              impact: 'High',
              mitigation_strategy: 'Strategy here',
            },
          ],
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.resources.displayType).toBe('table');
      expect(normalized.risk_mitigation.displayType).toBe('table');
    });

    it('should infer infographic displayType for metrics/KPIs', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        assessment_strategy: {
          kpis: [
            {
              metric: 'Completion Rate',
              target: '85%',
              measurement_method: 'LMS analytics',
            },
          ],
        },
        success_metrics: {
          metrics: [
            {
              metric: 'ROI',
              current_baseline: '0%',
              target: '150%',
              measurement_method: 'Financial analysis',
            },
          ],
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.assessment_strategy.displayType).toBe('infographic');
      expect(normalized.success_metrics.displayType).toBe('infographic');
    });

    it('should preserve existing displayType if present', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        summary: {
          content: 'Test',
          displayType: 'chart',
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.summary.displayType).toBe('chart');
    });

    it('should correct invalid displayType values', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        summary: {
          content: 'Test',
          displayType: 'invalid-type',
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      // Should default to markdown for invalid type
      expect(normalized.summary.displayType).toBe('markdown');
    });

    it('should ignore metadata and internal fields', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Org',
          role: 'Role',
          generated_at: new Date().toISOString(),
        },
        _internal_field: {
          data: 'internal',
        },
        summary: {
          content: 'Test',
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      // metadata should not get displayType
      expect(normalized.metadata.displayType).toBeUndefined();
      // _internal_field should not get displayType
      expect(normalized._internal_field.displayType).toBeUndefined();
      // summary should get displayType
      expect(normalized.summary.displayType).toBe('markdown');
    });
  });

  describe('End-to-End Blueprint Flow', () => {
    it('should parse, validate, and normalize a complete blueprint', () => {
      const blueprintJSON = JSON.stringify({
        metadata: {
          title: 'Leadership Development Program',
          organization: 'Tech Startup Inc',
          role: 'L&D Manager',
          generated_at: new Date().toISOString(),
          version: '1.0',
          model: 'gemini-3.1-pro-preview',
        },
        executive_summary: {
          content: 'This comprehensive leadership development program...',
        },
        learning_objectives: {
          objectives: [
            {
              id: 'obj1',
              title: 'Develop Strategic Thinking',
              description: 'Enable leaders to think strategically...',
              metric: 'Strategic decision quality score',
              baseline: '3.2/5',
              target: '4.5/5',
              due_date: '2025-12-31',
            },
          ],
        },
        implementation_timeline: {
          phases: [
            {
              phase: 'Design',
              start_date: '2025-01-01',
              end_date: '2025-02-15',
              milestones: ['Complete needs analysis', 'Finalize curriculum'],
              dependencies: [],
            },
          ],
        },
        resources: {
          human_resources: [{ role: 'Instructional Designer', fte: 0.5, duration: '3 months' }],
          budget: {
            currency: 'USD',
            items: [{ item: 'Content Development', amount: 50000 }],
            total: 50000,
          },
        },
      });

      // Parse
      const parsed = parseAndValidateJSON(blueprintJSON);
      expect(parsed).toBeDefined();

      // Validate
      expect(() => validateBlueprintStructure(parsed)).not.toThrow();

      // Normalize
      const normalized = normalizeBlueprintStructure(parsed);

      // Verify inferred displayTypes
      expect(normalized.executive_summary.displayType).toBe('markdown');
      expect(normalized.learning_objectives.displayType).toBe('infographic');
      expect(normalized.implementation_timeline.displayType).toBe('timeline');
      expect(normalized.resources.displayType).toBe('table');

      // Verify data integrity
      expect(normalized.metadata.title).toBe('Leadership Development Program');
      expect(normalized.learning_objectives.objectives).toHaveLength(1);
    });
  });
});

describe('Blueprint Display Graceful Degradation', () => {
  it('should handle missing section data gracefully', () => {
    const blueprint = {
      metadata: {
        title: 'Test',
        organization: 'Org',
        role: 'Role',
        generated_at: new Date().toISOString(),
      },
      summary: {
        displayType: 'infographic',
        // Missing expected data fields
      },
    };

    const normalized = normalizeBlueprintStructure(blueprint);

    // Should not crash - just use the displayType as-is
    expect(normalized.summary.displayType).toBe('infographic');
  });

  it('should handle malformed section data', () => {
    const blueprint = {
      metadata: {
        title: 'Test',
        organization: 'Org',
        role: 'Role',
        generated_at: new Date().toISOString(),
      },
      objectives: {
        displayType: 'infographic',
        objectives: 'not-an-array', // Malformed - should be array
      },
    };

    const normalized = normalizeBlueprintStructure(blueprint);

    // Should not crash during normalization
    expect(normalized).toBeDefined();
    expect(normalized.objectives.displayType).toBe('infographic');
  });
});
