'use client';

import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, FileImage, Code, Clock } from 'lucide-react';
import { exportService, ExportHistoryEntry } from '@/lib/export';

interface ExportHistoryProps {
  className?: string;
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({ className = '' }) => {
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const historyData = exportService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load export history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (entry: ExportHistoryEntry) => {
    // This would need to be implemented to re-download from history
    // For now, we'll just show a message
    alert(`Downloading ${entry.fileName}...`);
  };

  const handleDelete = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this export history entry?')) {
      try {
        exportService.removeHistoryEntry(entryId);
        loadHistory();
      } catch (error) {
        console.error('Failed to delete history entry:', error);
        alert('Failed to delete history entry');
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all export history?')) {
      try {
        exportService.clearHistory();
        setHistory([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
        alert('Failed to clear history');
      }
    }
  };

  const formatIcons = {
    pdf: FileImage,
    markdown: FileText,
    json: Code,
  };

  const formatColors = {
    pdf: 'text-red-600',
    markdown: 'text-gray-600',
    json: 'text-success',
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">Loading export history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>No export history found</p>
          <p className="text-sm">Your exports will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export History</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {history.map((entry) => {
          const Icon = formatIcons[entry.format as keyof typeof formatIcons];
          const colorClass = formatColors[entry.format as keyof typeof formatColors];

          return (
            <div
              key={entry.id}
              className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {entry.fileName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.metadata.title} • {formatFileSize(entry.fileSize)} •{' '}
                      {formatDate(entry.exportedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(entry)}
                    className="hover:text-secondary dark:hover:text-secondary-light p-2 text-gray-400 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        {history.length} export{history.length !== 1 ? 's' : ''} in history
      </div>
    </div>
  );
};
