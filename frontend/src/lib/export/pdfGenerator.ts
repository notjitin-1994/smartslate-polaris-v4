import { jsPDF } from 'jspdf';
import { Blueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import { ExportData, ExportOptions, ExportResult, ExportMetadata } from './types';
import { PDFLayoutManager } from './pdfLayout';
import { ChartCaptureService } from './chartCapture';
import { blueprintPDFStyles, blueprintPDFColors, defaultPageConfig } from './pdfStyles';

export class BlueprintPDFGenerator {
  private doc: jsPDF;
  private layout: PDFLayoutManager;
  private chartCapture: ChartCaptureService;

  constructor() {
    this.doc = new jsPDF({
      orientation: defaultPageConfig.orientation,
      unit: defaultPageConfig.unit,
      format: defaultPageConfig.format,
      compress: true,
    });

    this.layout = new PDFLayoutManager(this.doc);
    this.chartCapture = new ChartCaptureService();
  }

  /**
   * Generate complete blueprint PDF
   */
  async generateBlueprintPDF(data: ExportData, options: ExportOptions): Promise<ExportResult> {
    try {
      // Add header with metadata
      await this.addHeader(data.metadata);

      // Add overview section
      this.addOverviewSection(data.blueprint);

      // Add learning objectives
      this.addLearningObjectivesSection(data.blueprint);

      // Add modules section
      this.addModulesSection(data.blueprint);

      // Add timeline if available
      if (data.blueprint.timeline) {
        this.addTimelineSection(data.blueprint.timeline);
      }

      // Add resources section
      if (data.blueprint.resources && data.blueprint.resources.length > 0) {
        this.addResourcesSection(data.blueprint.resources);
      }

      // Add dashboard charts if available and requested
      if (options.includeCharts && data.dashboardData && data.charts) {
        await this.addDashboardCharts(data.charts);
      }

      // Add footer
      this.addFooter(data.metadata);

      // Generate blob
      const pdfBlob = this.doc.output('blob');

      return {
        success: true,
        data: pdfBlob,
        metadata: data.metadata,
        fileSize: pdfBlob.size,
      };
    } catch (error) {
      console.error('PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      };
    }
  }

  /**
   * Add header with metadata
   */
  private async addHeader(metadata: ExportMetadata): Promise<void> {
    // Title
    this.layout.addSectionHeader(metadata.title, 1);

    // Description
    if (metadata.description) {
      this.layout.addTextContent(metadata.description);
    }

    // Metadata table
    const metadataData = [
      ['Author', metadata.author || 'Unknown'],
      ['Created', new Date(metadata.createdAt).toLocaleDateString()],
      ['Exported', new Date(metadata.exportedAt).toLocaleDateString()],
      ['Version', metadata.version],
    ];

    this.layout.addTable(metadataData, ['Property', 'Value']);
    this.layout.addSpacing(20);
  }

  /**
   * Add overview section
   */
  private addOverviewSection(blueprint: Blueprint): void {
    this.layout.addSectionHeader('Overview', 2);
    this.layout.addTextContent(blueprint.overview);
    this.layout.addSpacing(15);
  }

  /**
   * Add learning objectives section
   */
  private addLearningObjectivesSection(blueprint: Blueprint): void {
    this.layout.addSectionHeader('Learning Objectives', 2);
    this.layout.addBulletList(blueprint.learningObjectives);
  }

  /**
   * Add modules section
   */
  private addModulesSection(blueprint: Blueprint): void {
    this.layout.addSectionHeader('Learning Modules', 2);

    blueprint.modules.forEach((module, index) => {
      this.layout.addSectionHeader(`${index + 1}. ${module.title}`, 3);

      // Module details
      const details = [`Duration: ${module.duration} hours`, `Topics: ${module.topics.join(', ')}`];

      this.layout.addTextContent(details.join(' | '));

      // Activities
      if (module.activities.length > 0) {
        this.layout.addTextContent('Activities:', 'body');
        this.layout.addBulletList(module.activities, 10);
      }

      // Assessments
      if (module.assessments.length > 0) {
        this.layout.addTextContent('Assessments:', 'body');
        this.layout.addBulletList(module.assessments, 10);
      }

      this.layout.addSpacing(15);
    });
  }

  /**
   * Add timeline section
   */
  private addTimelineSection(timeline: Record<string, string>): void {
    this.layout.addSectionHeader('Timeline', 2);

    const timelineData = Object.entries(timeline).map(([week, description]) => [week, description]);

    this.layout.addTable(timelineData, ['Week', 'Description']);
  }

  /**
   * Add resources section
   */
  private addResourcesSection(
    resources: Array<{ name: string; type: string; url?: string }>
  ): void {
    this.layout.addSectionHeader('Resources', 2);

    const resourcesData = resources.map((resource) => [
      resource.name,
      resource.type,
      resource.url || 'N/A',
    ]);

    this.layout.addTable(resourcesData, ['Name', 'Type', 'URL']);
  }

  /**
   * Add dashboard charts
   */
  private async addDashboardCharts(charts: {
    timeline?: string;
    moduleBreakdown?: string;
    activityDistribution?: string;
  }): Promise<void> {
    this.layout.addSectionHeader('Dashboard Analytics', 2);

    if (charts.timeline) {
      this.layout.addImage(charts.timeline, 150, 100, 'Learning Progress Timeline');
    }

    if (charts.moduleBreakdown) {
      this.layout.addImage(charts.moduleBreakdown, 150, 100, 'Module Completion Breakdown');
    }

    if (charts.activityDistribution) {
      this.layout.addImage(charts.activityDistribution, 150, 100, 'Activity Distribution');
    }
  }

  /**
   * Add footer with page numbers
   */
  private addFooter(metadata: ExportMetadata): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Footer line
      this.doc.setDrawColor(...blueprintPDFColors.border);
      this.doc.setLineWidth(0.5);
      this.doc.line(
        20,
        this.doc.internal.pageSize.height - 15,
        this.doc.internal.pageSize.width - 20,
        this.doc.internal.pageSize.height - 15
      );

      // Page number
      this.doc.setFont(blueprintPDFStyles.caption.family, 'normal');
      this.doc.setFontSize(blueprintPDFStyles.caption.size);
      this.doc.setTextColor(...blueprintPDFStyles.caption.color);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.doc.internal.pageSize.width - 40,
        this.doc.internal.pageSize.height - 10,
        { align: 'right' }
      );

      // Export info
      this.doc.text(
        `Exported on ${new Date(metadata.exportedAt).toLocaleDateString()}`,
        20,
        this.doc.internal.pageSize.height - 10
      );
    }
  }

  /**
   * Get the PDF document
   */
  getDocument(): jsPDF {
    return this.doc;
  }
}
