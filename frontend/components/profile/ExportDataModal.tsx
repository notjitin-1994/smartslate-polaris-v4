'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportComplete(false);

      const response = await fetch('/api/user/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `smartslate_data_export_${Date.now()}.zip`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportComplete(true);
      toast.success('Data export downloaded successfully');

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        onClose();
        // Reset state after modal closes
        setTimeout(() => {
          setExportComplete(false);
          setIsExporting(false);
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Export data error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      setExportError(errorMessage);
      toast.error(errorMessage);
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      // Reset state after modal closes
      setTimeout(() => {
        setExportComplete(false);
        setExportError(null);
      }, 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-2xl backdrop-blur-xl"
            >
              {/* Header */}
              <div className="relative border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Export Your Data</h2>
                      <p className="text-sm text-slate-400">
                        GDPR Article 20 - Right to Data Portability
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isExporting}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!exportComplete && !exportError && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-indigo-400" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium text-white">What will be exported?</p>
                          <ul className="space-y-1 text-sm text-slate-400">
                            <li className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-indigo-400" />
                              User profile and account information
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-indigo-400" />
                              All learning blueprints and versions
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-indigo-400" />
                              Activity logs and usage history
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-indigo-400" />
                              Login history and sessions
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-indigo-400" />
                              Notification preferences
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-sm text-amber-200/90">
                        <strong className="font-medium">Export Format:</strong> You will receive a
                        ZIP file containing your data in both JSON (machine-readable) and CSV
                        (spreadsheet-compatible) formats, along with a README file explaining the
                        contents.
                      </p>
                    </div>

                    {isExporting && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-6"
                      >
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                        <p className="text-sm font-medium text-indigo-200">
                          Generating your data export...
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {exportComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-4 py-8"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white">Export Complete!</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Your data has been downloaded successfully
                      </p>
                    </div>
                  </motion.div>
                )}

                {exportError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-4 py-8"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white">Export Failed</h3>
                      <p className="mt-1 text-sm text-slate-400">{exportError}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {!exportComplete && (
                <div className="border-t border-white/10 bg-white/5 px-6 py-4">
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      disabled={isExporting}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isExporting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Exporting...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Download className="h-4 w-4" />
                          Export Data
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
