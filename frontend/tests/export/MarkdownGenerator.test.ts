import { describe, it, expect } from 'vitest';
import { MarkdownGenerator } from '@/lib/export/markdownGenerator';
import { Blueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import { ExportData, ExportOptions, ExportMetadata } from '@/lib/export/types';

describe('MarkdownGenerator', () => {
  let generator: MarkdownGenerator;
  let mockBlueprint: Blueprint;
  let mockDashboardData: DashboardData;
  let mockMetadata: ExportMetadata;

  beforeEach(() => {
    generator = new MarkdownGenerator();

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

  describe('generateMarkdown', () => {
    it('should generate markdown with front matter', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('---');
      expect(markdown).toContain('title: "Test Learning Blueprint"');
      expect(markdown).toContain('author: "Test User"');
      expect(markdown).toContain('version: 1.0.0');
    });

    it('should generate markdown with blueprint content', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('# Test Learning Blueprint');
      expect(markdown).toContain('A comprehensive learning plan for testing');
      expect(markdown).toContain('## Learning Objectives');
      expect(markdown).toContain('1. Learn fundamental concepts');
      expect(markdown).toContain('## Learning Modules');
      expect(markdown).toContain('### 1. Module 1: Fundamentals');
      expect(markdown).toContain('**Duration:** 10 hours');
    });

    it('should generate markdown with timeline', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('## Timeline');
      expect(markdown).toContain('| Week | Description |');
      expect(markdown).toContain('| Week 1 | Introduction and setup |');
      expect(markdown).toContain('| Week 2 | Core concepts |');
    });

    it('should generate markdown with resources', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('## Resources');
      expect(markdown).toContain('| Name | Type | URL |');
      expect(markdown).toContain(
        '| Resource 1 | book | [https://example\\.com/resource1](https://example.com/resource1) |'
      );
      expect(markdown).toContain('| Resource 2 | video | N/A |');
    });

    it('should generate markdown with dashboard analytics when included', () => {
      const data: ExportData = {
        blueprint: mockBlueprint,
        dashboardData: mockDashboardData,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: true,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('## Dashboard Analytics');
      expect(markdown).toContain('### Key Performance Indicators');
      expect(markdown).toContain('**Total Learning Hours:** 25');
      expect(markdown).toContain('**Total Modules:** 2');
      expect(markdown).toContain('### Module Progress');
      expect(markdown).toContain('| Module | Status | Progress | Estimated Hours |');
    });

    it('should escape markdown special characters', () => {
      const blueprintWithSpecialChars: Blueprint = {
        ...mockBlueprint,
        title: 'Test [Special] Characters * Bold _ Italic',
        overview:
          'This has **bold** and *italic* text with `code` and [links](https://example.com)',
      };

      const data: ExportData = {
        blueprint: blueprintWithSpecialChars,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('# Test \\[Special\\] Characters \\* Bold \\_ Italic');
      expect(markdown).toContain(
        'This has \\*\\*bold\\*\\* and \\*italic\\* text with \\`code\\` and \\[links\\]\\(https://example\\.com\\)'
      );
    });

    it('should handle empty timeline gracefully', () => {
      const blueprintWithoutTimeline: Blueprint = {
        ...mockBlueprint,
        timeline: {},
      };

      const data: ExportData = {
        blueprint: blueprintWithoutTimeline,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('## Timeline');
      expect(markdown).toContain('*No timeline information available.*');
    });

    it('should handle empty resources gracefully', () => {
      const blueprintWithoutResources: Blueprint = {
        ...mockBlueprint,
        resources: [],
      };

      const data: ExportData = {
        blueprint: blueprintWithoutResources,
        metadata: mockMetadata,
      };

      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const markdown = generator.generateMarkdown(data, options);

      expect(markdown).toContain('## Resources');
      expect(markdown).toContain('*No resources available.*');
    });
  });
});
