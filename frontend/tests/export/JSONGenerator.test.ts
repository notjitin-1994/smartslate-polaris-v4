import { describe, it, expect, beforeEach } from 'vitest';
import { JSONGenerator } from '@/lib/export/jsonGenerator';
import { Blueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import { ExportData, ExportOptions, ExportMetadata } from '@/lib/export/types';

describe('JSONGenerator', () => {
  let generator: JSONGenerator;
  let mockBlueprint: Blueprint;
  let mockDashboardData: DashboardData;
  let mockMetadata: ExportMetadata;

  beforeEach(() => {
    generator = new JSONGenerator();

    mockBlueprint = {
      title: 'Test Learning Blueprint',
      overview: 'A comprehensive learning plan for testing',
      learningObjectives: [
        'Learn fundamental concepts',
        'Apply knowledge in practice',
        'Master advanced techniques',
      ],
      modules: [
        {
          title: 'Module 1: Fundamentals',
          duration: 10,
          topics: ['Topic 1', 'Topic 2'],
          activities: ['Activity 1', 'Activity 2'],
          assessments: ['Assessment 1'],
        },
        {
          title: 'Module 2: Advanced',
          duration: 15,
          topics: ['Advanced Topic 1'],
          activities: ['Advanced Activity 1'],
          assessments: ['Advanced Assessment 1'],
        },
      ],
      timeline: {
        'Week 1': 'Introduction and setup',
        'Week 2': 'Core concepts',
      },
      resources: [
        {
          name: 'Resource 1',
          type: 'book',
          url: 'https://example.com/resource1',
        },
        {
          name: 'Resource 2',
          type: 'video',
        },
      ],
    };

    mockDashboardData = {
      blueprintId: 'test-blueprint-id',
      title: 'Test Blueprint Dashboard',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'completed',
      kpis: {
        totalLearningHours: 25,
        totalModules: 2,
        completedModules: 2,
        totalAssessments: 2,
        completedAssessments: 2,
        totalResources: 2,
        estimatedCompletionDate: '2024-02-01',
      },
      timeline: [
        {
          date: '2024-01-01',
          learningHours: 5,
          progressPercentage: 20,
          milestones: ['Started learning'],
        },
      ],
      modules: [
        {
          id: 'module-1',
          title: 'Module 1: Fundamentals',
          status: 'completed',
          progressPercentage: 100,
          estimatedHours: 10,
          actualHours: 10,
          category: 'fundamentals',
        },
      ],
      activities: [
        {
          category: 'reading',
          hours: 10,
          percentage: 40,
          color: '#3B82F6',
        },
      ],
      resources: [
        {
          id: 'resource-1',
          title: 'Resource 1',
          type: 'book',
          status: 'completed',
          estimatedTime: 5,
        },
      ],
    };

    mockMetadata = {
      title: 'Test Learning Blueprint',
      description: 'A comprehensive learning plan for testing',
      author: 'Test User',
      createdAt: '2024-01-01T00:00:00Z',
      exportedAt: '2024-01-01T00:00:00Z',
      version: '1.0.0',
      blueprintId: 'test-blueprint-id',
      userId: 'test-user-id',
    };
  });

  describe('generateJSON', () => {
    it('should generate valid JSON with schema version', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: false,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.schemaVersion).toBe('1.0.0');
      expect(json.export).toBeDefined();
      expect(json.blueprint).toBeDefined();
      expect(json.metadata).toBeDefined();
    });

    it('should include export metadata', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: false,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.export.format).toBe('json');
      expect(json.export.version).toBe('1.0.0');
      expect(json.export.exportedAt).toBeDefined();
      expect(json.export.blueprintId).toBe('test-blueprint-id');
      expect(json.export.userId).toBe('test-user-id');
    });

    it('should include blueprint data', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: false,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.blueprint.title).toBe('Test Learning Blueprint');
      expect(json.blueprint.overview).toBe('A comprehensive learning plan for testing');
      expect(json.blueprint.learningObjectives).toHaveLength(3);
      expect(json.blueprint.modules).toHaveLength(2);
      expect(json.blueprint.timeline).toBeDefined();
      expect(json.blueprint.resources).toHaveLength(2);
    });

    it('should include dashboard data when provided', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        dashboardData: mockDashboardData,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: true,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.dashboard).toBeDefined();
      expect(json.dashboard.blueprintId).toBe('test-blueprint-id');
      expect(json.dashboard.kpis.totalLearningHours).toBe(25);
      expect(json.dashboard.modules).toHaveLength(1);
      expect(json.dashboard.activities).toHaveLength(1);
      expect(json.dashboard.resources).toHaveLength(1);
    });

    it('should include chart data when provided', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        dashboardData: mockDashboardData,
        metadata: mockMetadata,
        charts: {
          timeline: 'data:image/png;base64,mock',
          moduleBreakdown: 'data:image/png;base64,mock',
          activityDistribution: 'data:image/png;base64,mock',
        },
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: true,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.charts).toBeDefined();
      expect(json.charts.timeline).toBe('data:image/png;base64,mock');
      expect(json.charts.moduleBreakdown).toBe('data:image/png;base64,mock');
      expect(json.charts.activityDistribution).toBe('data:image/png;base64,mock');
    });

    it('should include export options in metadata', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: true,
        includeMetadata: true,
        customStyling: true,
        pageSize: 'A4',
        orientation: 'portrait',
        quality: 'high',
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.metadata.exportOptions).toBeDefined();
      expect(json.metadata.exportOptions.includeCharts).toBe(true);
      expect(json.metadata.exportOptions.includeMetadata).toBe(true);
      expect(json.metadata.exportOptions.customStyling).toBe(true);
      expect(json.metadata.exportOptions.pageSize).toBe('A4');
      expect(json.metadata.exportOptions.orientation).toBe('portrait');
      expect(json.metadata.exportOptions.quality).toBe('high');
    });

    it('should handle null dashboard data', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: false,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);
      const json = JSON.parse(jsonString);

      expect(json.dashboard).toBeNull();
      expect(json.charts).toBeNull();
    });

    it('should be pretty-printed with 2-space indentation', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'json',
        includeCharts: false,
        includeMetadata: true,
      };

      const jsonString = generator.generateJSON(data, options);

      // Check that it's pretty-printed (contains newlines and spaces)
      expect(jsonString).toContain('\n  ');
      expect(jsonString).toContain('\n    ');

      // Verify it's valid JSON
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });

  describe('validateJSON', () => {
    it('should validate correct JSON structure', () => {
      const validJson = JSON.stringify({
        schemaVersion: '1.0.0',
        blueprint: {
          title: 'Test',
          overview: 'Test overview',
          learningObjectives: ['Objective 1'],
          modules: [
            {
              title: 'Module 1',
              duration: 10,
              topics: ['Topic 1'],
              activities: ['Activity 1'],
              assessments: ['Assessment 1'],
            },
          ],
        },
        export: {
          format: 'json',
          version: '1.0.0',
          exportedAt: '2024-01-01T00:00:00Z',
        },
      });

      const result = generator.validateJSON(validJson);
      expect(result.valid).toBe(true);
    });

    it('should reject JSON without schemaVersion', () => {
      const invalidJson = JSON.stringify({
        blueprint: { title: 'Test' },
        export: { format: 'json' },
      });

      const result = generator.validateJSON(invalidJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing schemaVersion');
    });

    it('should reject JSON without blueprint', () => {
      const invalidJson = JSON.stringify({
        schemaVersion: '1.0.0',
        export: { format: 'json' },
      });

      const result = generator.validateJSON(invalidJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing blueprint data');
    });

    it('should reject JSON without required blueprint fields', () => {
      const invalidJson = JSON.stringify({
        schemaVersion: '1.0.0',
        blueprint: { title: 'Test' }, // Missing overview, learningObjectives, modules
        export: { format: 'json' },
      });

      const result = generator.validateJSON(invalidJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required blueprint fields');
    });

    it('should reject JSON with invalid learningObjectives', () => {
      const invalidJson = JSON.stringify({
        schemaVersion: '1.0.0',
        blueprint: {
          title: 'Test',
          overview: 'Test overview',
          learningObjectives: 'not an array',
          modules: [],
        },
        export: { format: 'json' },
      });

      const result = generator.validateJSON(invalidJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Learning objectives must be an array');
    });

    it('should reject JSON with invalid modules', () => {
      const invalidJson = JSON.stringify({
        schemaVersion: '1.0.0',
        blueprint: {
          title: 'Test',
          overview: 'Test overview',
          learningObjectives: ['Objective 1'],
          modules: 'not an array',
        },
        export: { format: 'json' },
      });

      const result = generator.validateJSON(invalidJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Modules must be an array');
    });

    it('should reject invalid JSON format', () => {
      const invalidJson = '{"invalid": json}';

      const result = generator.validateJSON(invalidJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unexpected token');
    });
  });

  describe('generateSchema', () => {
    it('should generate valid JSON schema', () => {
      const schema = generator.generateSchema();

      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('required');
      expect(schema).toHaveProperty('properties');

      expect(schema.required).toContain('schemaVersion');
      expect(schema.required).toContain('blueprint');
      expect(schema.required).toContain('export');

      expect(schema.properties).toHaveProperty('schemaVersion');
      expect(schema.properties).toHaveProperty('blueprint');
      expect(schema.properties).toHaveProperty('export');
    });
  });
});
