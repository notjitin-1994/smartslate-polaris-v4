import { AnyBlueprint, isFullBlueprint } from '@/lib/ollama/schema';
import { ExportData, ExportOptions, ExportResult } from './types';

export class JSONGenerator {
  /**
   * Generate JSON content from blueprint data
   */
  generateJSON(data: ExportData, options: ExportOptions): string {
    const { blueprint, dashboardData, metadata, charts } = data;

    const exportData = {
      // Schema version for future compatibility
      schemaVersion: '1.0.0',

      // Export metadata
      export: {
        format: 'json',
        version: metadata.version,
        exportedAt: metadata.exportedAt,
        exportedBy: metadata.author || 'Unknown',
        blueprintId: metadata.blueprintId,
        userId: metadata.userId,
        fileSize: 0, // Will be calculated after generation
      },

      // Blueprint data
      blueprint: isFullBlueprint(blueprint as AnyBlueprint)
        ? blueprint
        : {
            title: (blueprint as any).title,
            overview: (blueprint as any).overview,
            learningObjectives: (blueprint as any).learningObjectives,
            modules: (blueprint as any).modules.map((module: any) => ({
              title: module.title,
              duration: module.duration,
              topics: module.topics,
              activities: module.activities,
              assessments: module.assessments,
            })),
            timeline: (blueprint as any).timeline || {},
            resources: (blueprint as any).resources || [],
          },

      // Dashboard data if available
      dashboard: dashboardData
        ? {
            blueprintId: dashboardData.blueprintId,
            title: dashboardData.title,
            createdAt: dashboardData.createdAt,
            updatedAt: dashboardData.updatedAt,
            status: dashboardData.status,
            kpis: {
              totalLearningHours: dashboardData.kpis.totalLearningHours,
              totalModules: dashboardData.kpis.totalModules,
              completedModules: dashboardData.kpis.completedModules,
              totalAssessments: dashboardData.kpis.totalAssessments,
              completedAssessments: dashboardData.kpis.completedAssessments,
              totalResources: dashboardData.kpis.totalResources,
              estimatedCompletionDate: dashboardData.kpis.estimatedCompletionDate,
            },
            timeline: dashboardData.timeline.map((item) => ({
              date: item.date,
              learningHours: item.learningHours,
              progressPercentage: item.progressPercentage,
              milestones: item.milestones,
            })),
            modules: dashboardData.modules.map((module) => ({
              id: module.id,
              title: module.title,
              status: module.status,
              progressPercentage: module.progressPercentage,
              estimatedHours: module.estimatedHours,
              actualHours: module.actualHours,
              dueDate: module.dueDate,
              category: module.category,
            })),
            activities: dashboardData.activities.map((activity) => ({
              category: activity.category,
              hours: activity.hours,
              percentage: activity.percentage,
              color: activity.color,
            })),
            resources: dashboardData.resources.map((resource) => ({
              id: resource.id,
              title: resource.title,
              type: resource.type,
              status: resource.status,
              estimatedTime: resource.estimatedTime,
              url: resource.url,
            })),
          }
        : null,

      // Chart data if available
      charts: charts
        ? {
            timeline: charts.timeline,
            moduleBreakdown: charts.moduleBreakdown,
            activityDistribution: charts.activityDistribution,
          }
        : null,

      // Additional metadata
      metadata: {
        generatedBy: 'SmartSlate Polaris v3',
        generatedAt: new Date().toISOString(),
        exportOptions: {
          includeCharts: options.includeCharts || false,
          includeMetadata: options.includeMetadata || false,
          customStyling: options.customStyling || false,
          pageSize: options.pageSize || 'A4',
          orientation: options.orientation || 'portrait',
          quality: options.quality || 'medium',
        },
      },
    };

    // Generate pretty-printed JSON with 2-space indentation
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Validate JSON structure
   */
  validateJSON(jsonString: string): { valid: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);

      // Basic structure validation
      if (!parsed.schemaVersion) {
        return { valid: false, error: 'Missing schemaVersion' };
      }

      if (!parsed.blueprint) {
        return { valid: false, error: 'Missing blueprint data' };
      }

      if (!parsed.blueprint.title || !parsed.blueprint.overview) {
        return { valid: false, error: 'Missing required blueprint fields' };
      }

      if (!Array.isArray(parsed.blueprint.learningObjectives)) {
        return { valid: false, error: 'Learning objectives must be an array' };
      }

      if (!Array.isArray(parsed.blueprint.modules)) {
        return { valid: false, error: 'Modules must be an array' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON format',
      };
    }
  }

  /**
   * Generate JSON schema for validation
   */
  generateSchema(): object {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['schemaVersion', 'blueprint', 'export'],
      properties: {
        schemaVersion: {
          type: 'string',
          description: 'Schema version for compatibility',
        },
        export: {
          type: 'object',
          required: ['format', 'version', 'exportedAt'],
          properties: {
            format: { type: 'string' },
            version: { type: 'string' },
            exportedAt: { type: 'string', format: 'date-time' },
            exportedBy: { type: 'string' },
            blueprintId: { type: 'string' },
            userId: { type: 'string' },
            fileSize: { type: 'number' },
          },
        },
        blueprint: {
          type: 'object',
          required: ['title', 'overview', 'learningObjectives', 'modules'],
          properties: {
            title: { type: 'string' },
            overview: { type: 'string' },
            learningObjectives: {
              type: 'array',
              items: { type: 'string' },
            },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                required: ['title', 'duration', 'topics', 'activities', 'assessments'],
                properties: {
                  title: { type: 'string' },
                  duration: { type: 'number' },
                  topics: { type: 'array', items: { type: 'string' } },
                  activities: { type: 'array', items: { type: 'string' } },
                  assessments: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            timeline: { type: 'object' },
            resources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
          },
        },
        dashboard: { type: 'object' },
        charts: { type: 'object' },
        metadata: { type: 'object' },
      },
    };
  }
}
