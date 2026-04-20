import { AnyBlueprint, isFullBlueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import {
  ExportData,
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportMetadata,
  BatchExportOptions,
  ExportHistoryEntry,
  ExportServiceConfig,
} from './types';

export class ExportService {
  private config: ExportServiceConfig;
  private history: ExportHistoryEntry[] = [];

  constructor(config?: Partial<ExportServiceConfig>) {
    this.config = {
      defaultPageSize: 'A4',
      defaultOrientation: 'portrait',
      defaultQuality: 'medium',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      enableHistory: true,
      maxHistoryEntries: 100,
      ...config,
    };

    this.loadHistory();
  }

  /**
   * Export a single blueprint to the specified format
   */
  public async exportBlueprint(
    blueprint: AnyBlueprint,
    options: ExportOptions,
    dashboardData?: DashboardData,
    metadata?: Partial<ExportMetadata>
  ): Promise<ExportResult> {
    try {
      const exportData: ExportData = {
        blueprint,
        dashboardData,
        metadata: this.createMetadata(blueprint, metadata),
      };

      let result: ExportResult;

      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF(exportData, options);
          break;
        case 'markdown':
          result = await this.exportToMarkdown(exportData, options);
          break;
        case 'json':
          result = await this.exportToJSON(exportData, options);
          break;
        case 'docx':
          result = await this.exportToWord(exportData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      if (result.success && this.config.enableHistory) {
        const title = isFullBlueprint(blueprint)
          ? blueprint.metadata?.organization
            ? `${blueprint.metadata.organization} Learning Blueprint`
            : 'Learning Blueprint'
          : (blueprint as any).title;
        this.addToHistory(result, options.format, title);
      }

      return result;
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
      };
    }
  }

  /**
   * Export multiple blueprints in batch
   */
  public async exportBatch(
    blueprints: AnyBlueprint[],
    options: BatchExportOptions,
    dashboardDataMap?: Map<string, DashboardData>
  ): Promise<ExportResult> {
    try {
      const results: ExportResult[] = [];
      const total = blueprints.length;

      for (let i = 0; i < blueprints.length; i++) {
        const blueprint = blueprints[i];
        const dashboardData = dashboardDataMap?.get(blueprint.title);

        const result = await this.exportBlueprint(blueprint, options, dashboardData);

        results.push(result);

        if (options.progressCallback) {
          options.progressCallback(((i + 1) / total) * 100);
        }
      }

      // Check if any exports were successful
      const successfulResults = results.filter((result) => result.success);

      if (successfulResults.length === 0) {
        return {
          success: false,
          error: 'All exports failed',
        };
      }

      // Create ZIP file if multiple formats or blueprints
      if (options.format === 'json' || blueprints.length > 1) {
        return await this.createZipFile(successfulResults, options.zipFileName);
      }

      return {
        success: true,
        data: successfulResults[0]?.data,
        metadata: successfulResults[0]?.metadata,
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
   * Get export history
   */
  public getHistory(): ExportHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Clear export history
   */
  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Remove specific history entry
   */
  public removeHistoryEntry(id: string): void {
    this.history = this.history.filter((entry) => entry.id !== id);
    this.saveHistory();
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      const { BlueprintPDFGenerator } = await import('./pdfGenerator');
      const { ChartCaptureService } = await import('./chartCapture');

      const pdfGenerator = new BlueprintPDFGenerator();
      const chartCapture = new ChartCaptureService();

      // Capture charts if requested and dashboard data is available
      if (options.includeCharts && data.dashboardData) {
        try {
          const charts = await chartCapture.captureDashboardCharts();
          data.charts = charts;
        } catch {
          console.warn('Failed to capture charts, proceeding without them');
        }
      }

      return await pdfGenerator.generateBlueprintPDF(data, options);
    } catch (error) {
      console.error('PDF export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed',
      };
    }
  }

  /**
   * Export to Markdown format
   */
  private async exportToMarkdown(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      const { MarkdownGenerator } = await import('./markdownGenerator');

      const generator = new MarkdownGenerator();
      const markdownContent = generator.generateMarkdown(data, options);

      // Create blob from markdown content
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });

      return {
        success: true,
        data: blob,
        metadata: data.metadata,
        fileSize: blob.size,
      };
    } catch (error) {
      console.error('Markdown export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Markdown export failed',
      };
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      const { JSONGenerator } = await import('./jsonGenerator');

      const generator = new JSONGenerator();
      const jsonContent = generator.generateJSON(data, options);

      // Validate the generated JSON
      const validation = generator.validateJSON(jsonContent);
      if (!validation.valid) {
        throw new Error(`JSON validation failed: ${validation.error}`);
      }

      // Create blob from JSON content
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });

      return {
        success: true,
        data: blob,
        metadata: data.metadata,
        fileSize: blob.size,
      };
    } catch (error) {
      console.error('JSON export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed',
      };
    }
  }

  /**
   * Export to Word (DOCX) format with rich text formatting
   */
  private async exportToWord(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      const { WordGenerator } = await import('./wordGenerator');

      const generator = new WordGenerator();
      return await generator.generateWordDocument(data, options);
    } catch (error) {
      console.error('Word export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Word export failed',
      };
    }
  }

  /**
   * Create metadata for export
   */
  private createMetadata(
    blueprint: AnyBlueprint,
    customMetadata?: Partial<ExportMetadata>
  ): ExportMetadata {
    if (isFullBlueprint(blueprint)) {
      const title = blueprint.metadata?.organization
        ? `${blueprint.metadata.organization} Learning Blueprint`
        : 'Learning Blueprint';
      const parts: string[] = [];
      if (blueprint.metadata?.role) parts.push(`Role: ${blueprint.metadata.role}`);
      if (blueprint.instructional_strategy?.cohort_model)
        parts.push(`Cohort: ${blueprint.instructional_strategy.cohort_model}`);
      const description = parts.join(' • ') || 'Auto-generated learning blueprint overview.';
      return {
        title,
        description,
        createdAt: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        ...customMetadata,
      };
    }
    const canonical = blueprint as any;
    return {
      title: canonical.title,
      description: canonical.overview,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      ...customMetadata,
    };
  }

  /**
   * Add entry to export history
   */
  private addToHistory(result: ExportResult, format: ExportFormat, title: string): void {
    if (!result.success || !result.metadata) return;

    const entry: ExportHistoryEntry = {
      id: this.generateId(),
      blueprintId: result.metadata.blueprintId || '',
      format,
      fileName: this.generateFileName(title, format),
      fileSize: result.fileSize || 0,
      exportedAt: result.metadata.exportedAt,
      metadata: result.metadata,
    };

    this.history.unshift(entry);

    // Keep only the most recent entries
    if (this.history.length > this.config.maxHistoryEntries) {
      this.history = this.history.slice(0, this.config.maxHistoryEntries);
    }

    this.saveHistory();
  }

  /**
   * Generate unique ID for history entries
   */
  private generateId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate filename for export
   */
  private generateFileName(title: string, format: ExportFormat): string {
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedTitle}_${timestamp}.${format}`;
  }

  /**
   * Create ZIP file for batch exports
   */
  private async createZipFile(
    results: ExportResult[],
    zipFileName?: string
  ): Promise<ExportResult> {
    try {
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default;
      const zip = new JSZip();

      // Add each successful export to the ZIP
      let successCount = 0;
      results.forEach((result, index) => {
        if (result.success && result.data) {
          const fileName = `${zipFileName || 'export'}_${index + 1}.${this.getFileExtension(result.metadata?.title || 'file')}`;
          zip.file(fileName, result.data);
          successCount++;
        }
      });

      if (successCount === 0) {
        return {
          success: false,
          error: 'No successful exports to include in ZIP file',
        };
      }

      // Add metadata file
      const metadata = {
        exportedAt: new Date().toISOString(),
        totalFiles: successCount,
        version: '1.0.0',
      };
      zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      return {
        success: true,
        data: zipBlob,
        metadata: {
          title: zipFileName || 'batch-export',
          description: `Batch export containing ${successCount} files`,
          createdAt: new Date().toISOString(),
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        },
        fileSize: zipBlob.size,
      };
    } catch (error) {
      console.error('ZIP creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ZIP creation failed',
      };
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'txt';
  }

  /**
   * Load export history from localStorage
   */
  private loadHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('export_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load export history:', error);
      this.history = [];
    }
  }

  /**
   * Save export history to localStorage
   */
  private saveHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('export_history', JSON.stringify(this.history));
    } catch {
      console.warn('Failed to save export history');
    }
  }
}

// Export a singleton instance
export const exportService = new ExportService();
