'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, FileText, FileImage, Code } from 'lucide-react';
import { ExportFormat, ExportResult, ExportMetadata } from '@/lib/export/types';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportResults: Map<ExportFormat, ExportResult>;
  metadata: ExportMetadata;
  onDownload: (format: ExportFormat) => void;
  onDownloadAll: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  exportResults,
  metadata,
  onDownload,
  onDownloadAll,
}) => {
  const [activeTab, setActiveTab] = useState<ExportFormat>('pdf');
  const [previewContent, setPreviewContent] = useState<string>('');

  const generatePreview = useCallback(
    async (format: ExportFormat) => {
      const result = exportResults.get(format);
      if (!result?.data) return;

      try {
        switch (format) {
          case 'pdf':
            // For PDF, we'll show a placeholder since we can't easily preview PDFs in browser
            setPreviewContent(
              'PDF preview not available in browser. Click download to view the file.'
            );
            break;
          case 'markdown':
            const markdownText = await result.data.text();
            setPreviewContent(markdownText);
            break;
          case 'json':
            const jsonText = await result.data.text();
            const formattedJson = JSON.stringify(JSON.parse(jsonText), null, 2);
            setPreviewContent(formattedJson);
            break;
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
        setPreviewContent('Preview not available');
      }
    },
    [exportResults]
  );

  useEffect(() => {
    if (isOpen && exportResults.has(activeTab)) {
      generatePreview(activeTab);
    }
  }, [isOpen, activeTab, exportResults, generatePreview]);

  const formatIcons: Record<ExportFormat, React.ElementType> = {
    pdf: FileImage,
    markdown: FileText,
    json: Code,
    docx: FileImage,
  };

  const formatNames: Record<ExportFormat, string> = {
    pdf: 'PDF',
    markdown: 'Markdown',
    json: 'JSON',
    docx: 'DOCX',
  };

  const formatDescriptions: Record<ExportFormat, string> = {
    pdf: 'Professional document with charts and styling',
    markdown: 'Plain text with formatting for documentation',
    json: 'Structured data for integration and processing',
    docx: 'Word document with professional formatting',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-strong max-h-preview flex w-full max-w-4xl flex-col rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Export Preview</h2>
            <p className="text-foreground/60 text-sm">
              {metadata.title} - {metadata.exportedAt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Format Tabs */}
        <div className="flex border-b border-white/10">
          {Object.entries(formatNames).map(([format, name]) => {
            const Icon = formatIcons[format as ExportFormat];
            const result = exportResults.get(format as ExportFormat);
            const isActive = activeTab === format;
            const isSuccess = result?.success;

            return (
              <button
                key={format}
                onClick={() => setActiveTab(format as ExportFormat)}
                className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'text-foreground/60 hover:text-foreground border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {name}
                {isSuccess ? (
                  <span className="bg-success h-2 w-2 rounded-full"></span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Format Info */}
          <div className="border-b border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              {React.createElement(formatIcons[activeTab], { className: 'w-5 h-5' })}
              <h3 className="text-foreground font-medium">{formatNames[activeTab]}</h3>
            </div>
            <p className="text-foreground/70 mt-1 text-sm">{formatDescriptions[activeTab]}</p>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-6">
            {(() => {
              const result = exportResults.get(activeTab);
              if (!result?.success) {
                return (
                  <div className="py-8 text-center">
                    <div className="text-sm text-red-500">
                      Export failed: {result?.error || 'Unknown error'}
                    </div>
                  </div>
                );
              }

              if (activeTab === 'pdf') {
                return (
                  <div className="py-8 text-center">
                    <FileImage className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="text-foreground/70 mb-4">PDF preview not available in browser</p>
                    <p className="text-foreground/60 text-sm">
                      Click download to view the generated PDF file
                    </p>
                  </div>
                );
              }

              return (
                <pre className="text-foreground max-h-96 overflow-auto rounded-lg border border-white/10 bg-white/5 p-4 text-sm whitespace-pre-wrap">
                  {previewContent}
                </pre>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/10 p-6">
            <div className="text-foreground/60 text-sm">
              {exportResults.size} format{exportResults.size !== 1 ? 's' : ''} ready for download
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDownloadAll}
                className="glass bg-secondary hover:bg-secondary-dark focus-visible:ring-secondary/50 focus-visible:ring-offset-background flex items-center gap-2 rounded-lg px-6 py-2.5 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download All
              </button>
              <button
                onClick={() => onDownload(activeTab)}
                disabled={!exportResults.get(activeTab)?.success}
                className="glass text-foreground hover:glass-strong focus-visible:ring-primary/50 flex items-center gap-2 rounded-lg px-6 py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download {formatNames[activeTab]}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
