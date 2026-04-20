import JSZip from 'jszip';
import type { BlueprintData } from '@/lib/stores/types';
import { DashboardData } from '@/types/dashboard';
import {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportMetadata,
  BatchExportOptions,
} from './types';
import { exportService } from './ExportService';

export class BatchExportService {
  /**
   * Export multiple blueprints in batch
   */
  async exportMultipleBlueprints(
    blueprints: BlueprintData[],
    options: BatchExportOptions,
    dashboardDataMap?: Map<string, DashboardData>
  ): Promise<ExportResult> {
    try {
      const zip = new JSZip();
      const results: ExportResult[] = [];
      const total = blueprints.length;

      // Export in all requested formats
      const formats: ExportFormat[] =
        options.format === 'json' ? ['pdf', 'markdown', 'json', 'docx'] : [options.format];

      // Create a folder for each blueprint
      for (let i = 0; i < blueprints.length; i++) {
        const blueprint = blueprints[i];
        const dashboardData = dashboardDataMap?.get(blueprint.title);

        // Create folder for this blueprint
        const folderName = this.sanitizeFileName(blueprint.title);
        const blueprintFolder = zip.folder(folderName);

        if (!blueprintFolder) {
          throw new Error(`Failed to create folder for blueprint: ${blueprint.title}`);
        }

        for (const format of formats) {
          const exportOptions: ExportOptions = {
            ...options,
            format,
          };

          const result = await exportService.exportBlueprint(
            blueprint,
            exportOptions,
            dashboardData
          );

          if (result.success && result.data) {
            const fileName = `${this.sanitizeFileName(blueprint.title)}.${format}`;
            blueprintFolder.file(fileName, result.data);
            results.push(result);
          } else {
            console.warn(`Failed to export ${blueprint.title} as ${format}:`, result.error);
          }
        }

        // Update progress
        if (options.progressCallback) {
          options.progressCallback(((i + 1) / total) * 100);
        }
      }

      // Add metadata file
      const metadata = {
        exportedAt: new Date().toISOString(),
        totalBlueprints: blueprints.length,
        successfulExports: results.length,
        formats: formats,
        version: '1.0.0',
      };

      zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      return {
        success: true,
        data: zipBlob,
        metadata: {
          title: options.zipFileName || 'blueprint-export',
          description: `Batch export of ${blueprints.length} blueprints`,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        fileSize: zipBlob.size,
      };
    } catch (error) {
      console.error('Batch export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch export failed',
      };
    }
  }

  /**
   * Export single blueprint in multiple formats
   */
  async exportBlueprintInAllFormats(
    blueprint: Blueprint,
    options: Partial<BatchExportOptions> = {},
    dashboardData?: DashboardData
  ): Promise<ExportResult> {
    const formats: ExportFormat[] = ['pdf', 'markdown', 'json', 'docx'];
    const zip = new JSZip();
    const results: ExportResult[] = [];

    for (const format of formats) {
      const exportOptions: ExportOptions = {
        format,
        includeCharts: options.includeCharts ?? true,
        includeMetadata: options.includeMetadata ?? true,
        customStyling: options.customStyling ?? true,
      };

      const result = await exportService.exportBlueprint(blueprint, exportOptions, dashboardData);

      if (result.success && result.data) {
        const fileName = `${this.sanitizeFileName(blueprint.title)}.${format}`;
        zip.file(fileName, result.data);
        results.push(result);
      } else {
        console.warn(`Failed to export as ${format}:`, result.error);
      }
    }

    if (results.length === 0) {
      return {
        success: false,
        error: 'No formats could be exported successfully',
      };
    }

    // Add metadata file
    const metadata = {
      blueprintTitle: blueprint.title,
      exportedAt: new Date().toISOString(),
      successfulFormats: results.map((r) => r.metadata?.title).filter(Boolean),
      version: '1.0.0',
    };

    zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return {
      success: true,
      data: zipBlob,
      metadata: {
        title: `${blueprint.title}-export`,
        description: `Multi-format export of ${blueprint.title}`,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      fileSize: zipBlob.size,
    };
  }

  /**
   * Export dashboard data for multiple blueprints
   */
  async exportDashboardData(
    blueprints: BlueprintData[],
    dashboardDataMap: Map<string, DashboardData>,
    options: Partial<BatchExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      const zip = new JSZip();
      const results: ExportResult[] = [];

      // Create dashboard data folder
      const dashboardFolder = zip.folder('dashboard-data');
      if (!dashboardFolder) {
        throw new Error('Failed to create dashboard data folder');
      }

      for (const blueprint of blueprints) {
        const dashboardData = dashboardDataMap.get(blueprint.title);
        if (!dashboardData) continue;

        const folderName = this.sanitizeFileName(blueprint.title);
        const blueprintFolder = dashboardFolder.folder(folderName);

        if (!blueprintFolder) continue;

        // Export dashboard data as JSON
        const dashboardJson = JSON.stringify(dashboardData, null, 2);
        blueprintFolder.file('dashboard-data.json', dashboardJson);

        // Export as CSV
        const csvData = this.convertDashboardToCSV(dashboardData);
        blueprintFolder.file('dashboard-data.csv', csvData);

        results.push({
          success: true,
          metadata: {
            title: `${blueprint.title} Dashboard Data`,
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      }

      // Add summary metadata
      const summaryMetadata = {
        exportedAt: new Date().toISOString(),
        totalBlueprints: blueprints.length,
        successfulExports: results.length,
        version: '1.0.0',
      };

      zip.file('summary-metadata.json', JSON.stringify(summaryMetadata, null, 2));

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      return {
        success: true,
        data: zipBlob,
        metadata: {
          title: 'dashboard-data-export',
          description: `Dashboard data export for ${blueprints.length} blueprints`,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        fileSize: zipBlob.size,
      };
    } catch (error) {
      console.error('Dashboard data export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Dashboard data export failed',
      };
    }
  }

  /**
   * Convert dashboard data to CSV format
   */
  private convertDashboardToCSV(dashboardData: DashboardData): string {
    const lines: string[] = [];

    // Header
    lines.push('Type,Name,Value,Details');

    // KPIs
    lines.push(`KPI,Total Learning Hours,${dashboardData.kpis.totalLearningHours},`);
    lines.push(`KPI,Total Modules,${dashboardData.kpis.totalModules},`);
    lines.push(`KPI,Completed Modules,${dashboardData.kpis.completedModules},`);
    lines.push(`KPI,Total Assessments,${dashboardData.kpis.totalAssessments},`);
    lines.push(`KPI,Completed Assessments,${dashboardData.kpis.completedAssessments},`);
    lines.push(`KPI,Total Resources,${dashboardData.kpis.totalResources},`);
    lines.push(`KPI,Estimated Completion Date,${dashboardData.kpis.estimatedCompletionDate},`);

    // Modules
    dashboardData.modules.forEach((module) => {
      lines.push(`Module,${module.title},${module.progressPercentage}%,Status: ${module.status}`);
    });

    // Activities
    dashboardData.activities.forEach((activity) => {
      lines.push(`Activity,${activity.category},${activity.hours} hours,${activity.percentage}%`);
    });

    // Resources
    dashboardData.resources.forEach((resource) => {
      lines.push(`Resource,${resource.title},${resource.type},Status: ${resource.status}`);
    });

    return lines.join('\n');
  }

  /**
   * Sanitize filename for safe file system usage
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50); // Limit length
  }
}

export const batchExportService = new BatchExportService();
