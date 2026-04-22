'use client';

import React, { useState } from 'react';
import { Download, FileText, FileImage, Code, Loader2, FileType } from 'lucide-react';
import { Blueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';
import {
  exportService,
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportMetadata,
} from '@/lib/export';
import { ExportPreviewModal } from './ExportPreviewModal';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  blueprint: Blueprint;
  dashboardData?: DashboardData;
  metadata?: Partial<ExportMetadata>;
  className?: string;
  showPreview?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  blueprint,
  dashboardData,
  metadata,
  className = '',
  showPreview = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [exportResults, setExportResults] = useState<Map<ExportFormat, ExportResult>>(new Map());
  const [exportMetadata, setExportMetadata] = useState<ExportMetadata | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        includeCharts: true,
        includeMetadata: true,
        customStyling: true,
      };

      const result = await exportService.exportBlueprint(
        blueprint,
        options,
        dashboardData,
        metadata
      );

      if (result.success) {
        if (showPreview) {
          setExportResults((prev) => new Map(prev.set(format, result)));
          setExportMetadata(result.metadata!);
          setShowModal(true);
        } else {
          downloadFile(result.data!, `${blueprint.title}.${format}`);
        }
      } else {
        console.error('Export failed:', result.error);
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);

    try {
      const formats: ExportFormat[] = ['pdf', 'markdown', 'json', 'docx'];
      const results = new Map<ExportFormat, ExportResult>();

      for (const format of formats) {
        const options: ExportOptions = {
          format,
          includeCharts: true,
          includeMetadata: true,
          customStyling: true,
        };

        const result = await exportService.exportBlueprint(
          blueprint,
          options,
          dashboardData,
          metadata
        );

        results.set(format, result);
      }

      setExportResults(results);
      setExportMetadata(results.get('pdf')?.metadata || null);
      setShowModal(true);
    } catch (error) {
      console.error('Export all error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = (format: ExportFormat) => {
    const result = exportResults.get(format);
    if (result?.success && result.data) {
      downloadFile(result.data, `${blueprint.title}.${format}`);
    }
  };

  const handleDownloadAll = () => {
    exportResults.forEach((result, format) => {
      if (result.success && result.data) {
        downloadFile(result.data, `${blueprint.title}.${format}`);
      }
    });
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <Button onClick={handleExportAll} disabled={isExporting} variant="primary" size="medium">
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {isExporting ? 'Exporting...' : 'Export All'}
        </Button>

        <div className="flex gap-1">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="glass bg-error/80 dark:bg-error/70 hover:bg-error/90 dark:hover:bg-error/80 focus-visible:ring-error/50 flex items-center gap-2 rounded-lg px-3 py-2 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            title="Export as PDF"
            aria-label="Export as PDF"
          >
            <FileImage className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            onClick={() => handleExport('markdown')}
            disabled={isExporting}
            className="glass flex items-center gap-2 rounded-lg bg-neutral-600 px-3 py-2 text-white transition-all duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-500/50 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            title="Export as Markdown"
            aria-label="Export as Markdown"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="glass bg-success/80 dark:bg-success/70 hover:bg-success/90 dark:hover:bg-success/80 focus-visible:ring-success/50 flex items-center gap-2 rounded-lg px-3 py-2 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            title="Export as JSON"
            aria-label="Export as JSON"
          >
            <Code className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            className="glass bg-primary/80 hover:bg-primary/90 focus-visible:ring-primary/50 dark:bg-primary/70 dark:hover:bg-primary/80 flex items-center gap-2 rounded-lg px-3 py-2 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            title="Export as Word Document"
            aria-label="Export as Word Document"
          >
            <FileType className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {showPreview && exportMetadata && (
        <ExportPreviewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          exportResults={exportResults}
          metadata={exportMetadata}
          onDownload={handleDownload}
          onDownloadAll={handleDownloadAll}
        />
      )}
    </>
  );
};
