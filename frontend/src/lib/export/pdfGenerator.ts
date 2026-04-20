import { jsPDF } from 'jspdf';
import { AnyBlueprint } from '@/lib/ollama/schema';
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
        if (Array.isArray(data.blueprint.timeline)) {
          this.addTimelineArraySection(data.blueprint.timeline);
        } else {
          this.addTimelineSection(data.blueprint.timeline as Record<string, string>);
        }
      }

      // Add resources section
      if (data.blueprint.resources) {
        if (Array.isArray(data.blueprint.resources)) {
          this.addResourcesArraySection(data.blueprint.resources);
        } else {
          this.addResourcesSection(
            data.blueprint.resources as Array<{ name: string; type: string; url?: string }>
          );
        }
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
  private addOverviewSection(blueprint: AnyBlueprint): void {
    this.layout.addSectionHeader('Overview', 2);
    this.layout.addTextContent(blueprint.overview);
    this.layout.addSpacing(15);
  }

  /**
   * Add learning objectives section
   */
  private addLearningObjectivesSection(blueprint: AnyBlueprint): void {
    this.layout.addSectionHeader('Learning Objectives', 2);
    this.layout.addBulletList(blueprint.learningObjectives);
  }

  /**
   * Add modules section
   */
  private addModulesSection(blueprint: AnyBlueprint): void {
    this.layout.addSectionHeader('Learning Modules', 2);

    blueprint.modules.forEach((module, index) => {
      this.layout.addSectionHeader(`${index + 1}. ${module.title}`, 3);

      // Module details
      const details = [`Duration: ${module.duration} hours`, `Topics: ${module.topics.join(', ')}`];

      this.layout.addTextContent(details.join(' | '));

      // Activities
      if (module.activities) {
        if (Array.isArray(module.activities)) {
          this.layout.addTextContent('Activities:', 'body');
          this.layout.addBulletList(module.activities as string[], 10);
        } else {
          this.layout.addTextContent('Activities:', 'body');
          const activityTexts = (module.activities as any[]).map((a: any) =>
            typeof a === 'string' ? a : `${a.title || a.type}: ${a.description || a.duration || ''}`
          );
          this.layout.addBulletList(activityTexts, 10);
        }
      }

      // Assessments
      if (module.assessments) {
        if (Array.isArray(module.assessments)) {
          this.layout.addTextContent('Assessments:', 'body');
          this.layout.addBulletList(module.assessments as string[], 10);
        } else {
          this.layout.addTextContent('Assessments:', 'body');
          const assessmentTexts = (module.assessments as any[]).map((a: any) =>
            typeof a === 'string' ? a : `${a.description || a.type}: ${a.weight || ''}`
          );
          this.layout.addBulletList(assessmentTexts, 10);
        }
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
   * Add timeline array section
   */
  private addTimelineArraySection(timeline: any[]): void {
    this.layout.addSectionHeader('Timeline', 2);

    const timelineData = timeline.map((item) => [
      item.phase || 'Phase',
      item.duration || 'Duration',
      item.description || 'Description',
    ]);

    this.layout.addTable(timelineData, ['Phase', 'Duration', 'Description']);
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
   * Add resources array section
   */
  private addResourcesArraySection(resources: any[]): void {
    this.layout.addSectionHeader('Resources', 2);

    const resourcesData = resources.map((resource) => [
      resource.name || 'Resource',
      resource.type || 'Type',
      resource.description || 'Description',
    ]);

    this.layout.addTable(resourcesData, ['Name', 'Type', 'Description']);
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
