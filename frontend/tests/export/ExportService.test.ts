import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportService } from '@/lib/export/ExportService';
import { Blueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import { ExportFormat, ExportOptions, ExportMetadata } from '@/lib/export/types';

// Mock the PDF generator
vi.mock('@/lib/export/pdfGenerator', () => ({
  BlueprintPDFGenerator: vi.fn().mockImplementation(() => ({
    generateBlueprintPDF: vi.fn().mockResolvedValue({
      success: true,
      data: new Blob(['mock pdf content'], { type: 'application/pdf' }),
      metadata: { title: 'Test Blueprint', exportedAt: new Date().toISOString(), version: '1.0.0' },
      fileSize: 1000,
    }),
  })),
}));

// Mock the Markdown generator
vi.mock('@/lib/export/markdownGenerator', () => ({
  MarkdownGenerator: vi.fn().mockImplementation(() => ({
    generateMarkdown: vi.fn().mockReturnValue('# Test Blueprint\n\nMock markdown content'),
  })),
}));

// Mock the JSON generator
vi.mock('@/lib/export/jsonGenerator', () => ({
  JSONGenerator: vi.fn().mockImplementation(() => ({
    generateJSON: vi.fn().mockReturnValue('{"title": "Test Blueprint", "version": "1.0.0"}'),
    validateJSON: vi.fn().mockReturnValue({ valid: true }),
  })),
}));

// Mock the chart capture service
vi.mock('@/lib/export/chartCapture', () => ({
  ChartCaptureService: vi.fn().mockImplementation(() => ({
    captureDashboardCharts: vi.fn().mockResolvedValue({
      timeline: 'data:image/png;base64,mock',
      moduleBreakdown: 'data:image/png;base64,mock',
      activityDistribution: 'data:image/png;base64,mock',
    }),
  })),
}));

// Mock JSZip
vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    folder: vi.fn().mockReturnValue({
      file: vi.fn(),
    }),
    file: vi.fn(),
    generateAsync: vi
      .fn()
      .mockResolvedValue(new Blob(['mock zip content'], { type: 'application/zip' })),
  })),
  JSZip: vi.fn().mockImplementation(() => ({
    folder: vi.fn().mockReturnValue({
      file: vi.fn(),
    }),
    file: vi.fn(),
    generateAsync: vi
      .fn()
      .mockResolvedValue(new Blob(['mock zip content'], { type: 'application/zip' })),
  })),
}));

describe('ExportService', () => {
  let exportService: ExportService;
  let mockBlueprint: Blueprint;
  let mockDashboardData: DashboardData;
  let mockMetadata: ExportMetadata;

  beforeEach(() => {
    exportService = new ExportService();

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
        totalResources: 1,
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportBlueprint', () => {
    it('should export blueprint as PDF successfully', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeCharts: true,
        includeMetadata: true,
      };

      const result = await exportService.exportBlueprint(
        mockBlueprint,
        options,
        mockDashboardData,
        mockMetadata
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.metadata).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should export blueprint as Markdown successfully', async () => {
      const options: ExportOptions = {
        format: 'markdown',
        includeCharts: false,
        includeMetadata: true,
      };

      const result = await exportService.exportBlueprint(
        mockBlueprint,
        options,
        undefined,
        mockMetadata
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.data?.type).toBe('text/markdown;charset=utf-8');
    });

    it('should export blueprint as JSON successfully', async () => {
      const options: ExportOptions = {
        format: 'json',
        includeCharts: false,
        includeMetadata: true,
      };

      const result = await exportService.exportBlueprint(
        mockBlueprint,
        options,
        undefined,
        mockMetadata
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(result.data?.type).toBe('application/json;charset=utf-8');
    });

    it('should handle export errors gracefully', async () => {
      // Mock a failing PDF generator
      const { BlueprintPDFGenerator } = await import('@/lib/export/pdfGenerator');
      vi.mocked(BlueprintPDFGenerator).mockImplementationOnce(() => ({
        generateBlueprintPDF: vi.fn().mockRejectedValue(new Error('PDF generation failed')),
      }));

      const options: ExportOptions = {
        format: 'pdf',
        includeCharts: true,
        includeMetadata: true,
      };

      const result = await exportService.exportBlueprint(
        mockBlueprint,
        options,
        mockDashboardData,
        mockMetadata
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('exportBatch', () => {
    it('should export multiple blueprints successfully', async () => {
      const blueprints = [mockBlueprint, { ...mockBlueprint, title: 'Second Blueprint' }];
      const options = {
        format: 'pdf' as ExportFormat,
        blueprintIds: ['blueprint-1', 'blueprint-2'],
        includeCharts: true,
        includeMetadata: true,
        progressCallback: vi.fn(),
      };

      const result = await exportService.exportBatch(blueprints, options);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
      expect(options.progressCallback).toHaveBeenCalled();
    });

    it('should handle batch export errors', async () => {
      const blueprints = [mockBlueprint];
      const options = {
        format: 'pdf' as ExportFormat,
        blueprintIds: ['blueprint-1'],
        includeCharts: true,
        includeMetadata: true,
        progressCallback: vi.fn(),
      };

      // Mock a failing export
      const { BlueprintPDFGenerator } = await import('@/lib/export/pdfGenerator');
      vi.mocked(BlueprintPDFGenerator).mockImplementationOnce(() => ({
        generateBlueprintPDF: vi.fn().mockRejectedValue(new Error('Batch export failed')),
      }));

      const result = await exportService.exportBatch(blueprints, options);

      // Batch export should fail when no exports succeed
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('export history', () => {
    it('should add successful exports to history', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeCharts: false,
        includeMetadata: true,
      };

      await exportService.exportBlueprint(mockBlueprint, options, undefined, mockMetadata);

      const history = exportService.getHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].format).toBe('pdf');
      expect(history[0].metadata.title).toBe('Test Blueprint');
    });

    it('should not add failed exports to history', async () => {
      // Mock a failing export
      const { BlueprintPDFGenerator } = await import('@/lib/export/pdfGenerator');
      vi.mocked(BlueprintPDFGenerator).mockImplementationOnce(() => ({
        generateBlueprintPDF: vi.fn().mockRejectedValue(new Error('Export failed')),
      }));

      const options: ExportOptions = {
        format: 'pdf',
        includeCharts: false,
        includeMetadata: true,
      };

      const initialHistoryLength = exportService.getHistory().length;

      await exportService.exportBlueprint(mockBlueprint, options, undefined, mockMetadata);

      const finalHistoryLength = exportService.getHistory().length;
      expect(finalHistoryLength).toBe(initialHistoryLength);
    });

    it('should clear history', () => {
      exportService.clearHistory();
      const history = exportService.getHistory();
      expect(history).toHaveLength(0);
    });

    it('should remove specific history entry', async () => {
      const options: ExportOptions = {
        format: 'pdf',
        includeCharts: false,
        includeMetadata: true,
      };

      await exportService.exportBlueprint(mockBlueprint, options, undefined, mockMetadata);

      const history = exportService.getHistory();
      const entryId = history[0].id;

      exportService.removeHistoryEntry(entryId);

      const updatedHistory = exportService.getHistory();
      expect(updatedHistory.find((entry) => entry.id === entryId)).toBeUndefined();
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const service = new ExportService();
      expect(service).toBeDefined();
    });

    it('should use custom configuration', () => {
      const customConfig = {
        defaultPageSize: 'Letter' as const,
        defaultOrientation: 'landscape' as const,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        enableHistory: false,
        maxHistoryEntries: 50,
      };

      const service = new ExportService(customConfig);
      expect(service).toBeDefined();
    });
  });
});
