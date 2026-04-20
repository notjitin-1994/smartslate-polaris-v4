import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DashboardData } from '@/types/dashboard';

export type ExportFormat = 'png' | 'jpg' | 'pdf' | 'json' | 'csv';

interface ExportOptions {
  format: ExportFormat;
  quality?: number;
  filename?: string;
  includeCharts?: boolean;
  includeData?: boolean;
}

class DashboardExportService {
  private async captureElement(elementId: string): Promise<HTMLCanvasElement> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    return await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });
  }

  private generateFilename(dashboardTitle: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cleanTitle = dashboardTitle.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanTitle}_dashboard_${timestamp}.${format}`;
  }

  async exportImage(
    elementId: string,
    format: 'png' | 'jpg',
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    try {
      const canvas = await this.captureElement(elementId);
      const link = document.createElement('a');

      const filename = options.filename || this.generateFilename('dashboard', format);
      link.download = filename;
      link.href = canvas.toDataURL(`image/${format}`, options.quality || 0.9);
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      throw new Error('Failed to export dashboard image');
    }
  }

  async exportPDF(elementId: string, options: Partial<ExportOptions> = {}): Promise<void> {
    try {
      const canvas = await this.captureElement(elementId);
      const imgData = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(options.filename || this.generateFilename('dashboard', 'pdf'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export dashboard PDF');
    }
  }

  async exportJSON(data: DashboardData, options: Partial<ExportOptions> = {}): Promise<void> {
    try {
      const exportData = {
        dashboard: data,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        metadata: {
          totalModules: data.modules.length,
          completedModules: data.modules.filter((m) => m.status === 'completed').length,
          totalHours: data.modules.reduce((sum, m) => sum + m.estimatedHours, 0),
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const link = document.createElement('a');
      const filename = options.filename || this.generateFilename(data.title, 'json');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw new Error('Failed to export dashboard JSON');
    }
  }

  async exportCSV(data: DashboardData, options: Partial<ExportOptions> = {}): Promise<void> {
    try {
      const csvData = [
        // Header row
        [
          'Module Title',
          'Status',
          'Progress',
          'Estimated Hours',
          'Actual Hours',
          'Category',
          'Due Date',
        ],
        // Data rows
        ...data.modules.map((module) => [
          module.title,
          module.status,
          `${module.progressPercentage}%`,
          module.estimatedHours.toString(),
          module.actualHours?.toString() || '',
          module.category,
          module.dueDate || '',
        ]),
      ];

      const csvContent = csvData
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      const filename = options.filename || this.generateFilename(data.title, 'csv');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error('Failed to export dashboard CSV');
    }
  }

  async exportDashboard(
    data: DashboardData,
    elementId: string,
    options: ExportOptions
  ): Promise<void> {
    const { format } = options;

    switch (format) {
      case 'png':
      case 'jpg':
        await this.exportImage(elementId, format, options);
        break;
      case 'pdf':
        await this.exportPDF(elementId, options);
        break;
      case 'json':
        await this.exportJSON(data, options);
        break;
      case 'csv':
        await this.exportCSV(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  getSupportedFormats(): ExportFormat[] {
    return ['png', 'jpg', 'pdf', 'json', 'csv'];
  }

  getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      pdf: 'application/pdf',
      json: 'application/json',
      csv: 'text/csv',
    };
    return mimeTypes[format];
  }
}

export const dashboardExportService = new DashboardExportService();
