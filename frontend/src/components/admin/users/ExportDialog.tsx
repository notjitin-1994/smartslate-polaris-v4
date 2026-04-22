'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, FileSpreadsheet, File, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast, adminToasts } from '@/lib/utils/toast';

interface FilterConfig {
  search: string;
  role: string;
  tier: string;
  status: 'all' | 'active' | 'inactive' | 'deleted';
  dateRange: { start: string; end: string } | null;
  usageRange: { min: number; max: number } | null;
}

interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

interface ExportDialogProps {
  filters: FilterConfig;
  sortConfig: SortConfig;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

const EXPORT_FORMATS = [
  {
    value: 'csv' as ExportFormat,
    label: 'CSV',
    description: 'Comma-separated values, compatible with Excel and Google Sheets',
    icon: FileText,
    color: 'text-green-400 bg-green-500/10',
  },
  {
    value: 'excel' as ExportFormat,
    label: 'Excel',
    description: 'Microsoft Excel format with formatting and multiple sheets',
    icon: FileSpreadsheet,
    color: 'text-blue-400 bg-blue-500/10',
  },
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF',
    description: 'Portable Document Format, great for printing and sharing',
    icon: File,
    color: 'text-red-400 bg-red-500/10',
  },
  {
    value: 'json' as ExportFormat,
    label: 'JSON',
    description: 'JavaScript Object Notation, ideal for data processing',
    icon: FileText,
    color: 'text-purple-400 bg-purple-500/10',
  },
];

export function ExportDialog({ filters, sortConfig, onClose }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Use POST endpoint with all filters and sorting
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: selectedFormat,
          filters: {
            ...(filters.search && { search: filters.search }),
            ...(filters.role && { role: filters.role }),
            ...(filters.tier && { tier: filters.tier }),
            ...(filters.status !== 'all' && { status: filters.status }),
            ...(filters.dateRange && { dateRange: filters.dateRange }),
            ...(filters.usageRange && { usageRange: filters.usageRange }),
          },
          sortBy: sortConfig.field,
          sortOrder: sortConfig.order,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `users-export-${Date.now()}.${selectedFormat}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      adminToasts.exportComplete(selectedFormat);
      setExportComplete(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      adminToasts.exportFailed(selectedFormat);
      toast.error('Export failed', errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-[#020C1B] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06B6D4]/20">
              <Download className="h-5 w-5 text-[#06B6D4]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export Users</h2>
              <p className="text-sm text-white/60">Choose format and fields to export</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Export Format Selection */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Export Format</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.value;

                  return (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`flex items-start space-x-3 rounded-lg border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[#06B6D4] bg-[#06B6D4]/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`rounded-lg p-2 ${format.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{format.label}</p>
                          {isSelected && <Check className="h-5 w-5 text-[#06B6D4]" />}
                        </div>
                        <p className="mt-1 text-xs text-white/60">{format.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filters Info */}
            {(filters.search ||
              filters.role ||
              filters.tier ||
              filters.status !== 'all' ||
              filters.dateRange ||
              filters.usageRange) && (
              <div className="rounded-lg border border-[#06B6D4]/30 bg-[#06B6D4]/10 p-4">
                <p className="text-sm font-medium text-[#06B6D4]">Active Filters</p>
                <p className="mt-1 text-xs text-[#06B6D4]/80">
                  Export will include only users matching your current filter criteria
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white">
                      Search: {filters.search}
                    </span>
                  )}
                  {filters.role && (
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white">
                      Role: {filters.role}
                    </span>
                  )}
                  {filters.tier && (
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white">
                      Tier: {filters.tier}
                    </span>
                  )}
                  {filters.status !== 'all' && (
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white">
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.dateRange && (
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white">
                      Date: {new Date(filters.dateRange.start).toLocaleDateString()} -{' '}
                      {new Date(filters.dateRange.end).toLocaleDateString()}
                    </span>
                  )}
                  {filters.usageRange && (
                    <span className="rounded bg-white/10 px-2 py-1 text-xs text-white">
                      Usage: {filters.usageRange.min}% - {filters.usageRange.max}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 p-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </Button>

          <Button
            onClick={handleExport}
            disabled={isExporting || exportComplete}
            className="bg-gradient-to-r from-[#06B6D4] to-blue-500 text-white hover:from-[#06B6D4]/90 hover:to-blue-600 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportComplete ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Export Complete!
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
