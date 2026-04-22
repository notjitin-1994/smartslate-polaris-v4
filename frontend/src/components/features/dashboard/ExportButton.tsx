'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileImage, FileText, File, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardData } from '@/types/dashboard';
import { dashboardExportService, ExportFormat } from '@/lib/dashboard/exportService';

interface ExportButtonProps {
  data: DashboardData;
  elementId: string;
  className?: string;
}

const formatOptions: Array<{
  format: ExportFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    format: 'png',
    label: 'PNG Image',
    icon: <FileImage className="h-4 w-4" />,
    description: 'High-quality image of the dashboard',
  },
  {
    format: 'jpg',
    label: 'JPG Image',
    icon: <FileImage className="h-4 w-4" />,
    description: 'Compressed image format',
  },
  {
    format: 'pdf',
    label: 'PDF Document',
    icon: <FileText className="h-4 w-4" />,
    description: 'Professional document format',
  },
  {
    format: 'json',
    label: 'JSON Data',
    icon: <File className="h-4 w-4" />,
    description: 'Raw dashboard data',
  },
  {
    format: 'csv',
    label: 'CSV Data',
    icon: <File className="h-4 w-4" />,
    description: 'Spreadsheet-compatible format',
  },
];

export function ExportButton({ data, elementId, className }: ExportButtonProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(format);
      setError(null);

      await dashboardExportService.exportDashboard(data, elementId, {
        format,
        quality: 0.9,
        filename: `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_dashboard`,
      });

      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      console.error('Export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export Dashboard
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          className="glass-strong absolute top-full right-0 z-50 mt-2 w-64 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Export Options
            </div>
            {formatOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                disabled={isExporting !== null}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700"
              >
                {option.icon}
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {option.description}
                  </div>
                </div>
                {isExporting === option.format && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
