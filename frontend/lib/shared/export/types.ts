import { AnyBlueprint } from '@/lib/ollama/schema';
import { DashboardData } from '@/types/dashboard';

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'docx';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  customStyling?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  quality?: 'low' | 'medium' | 'high';
}

export interface ExportMetadata {
  title: string;
  description?: string;
  author?: string;
  createdAt: string;
  exportedAt: string;
  version: string;
  blueprintId?: string;
  userId?: string;
  fileSize?: number;
}

export interface ExportData {
  blueprint: AnyBlueprint;
  dashboardData?: DashboardData;
  metadata: ExportMetadata;
  charts?: {
    timeline?: string; // base64 encoded chart image
    moduleBreakdown?: string;
    activityDistribution?: string;
  };
}

export interface ExportResult {
  success: boolean;
  data?: Blob;
  error?: string;
  metadata?: ExportMetadata;
  fileSize?: number;
}

export interface BatchExportOptions extends ExportOptions {
  blueprintIds: string[];
  zipFileName?: string;
  progressCallback?: (progress: number) => void;
}

export interface ExportHistoryEntry {
  id: string;
  blueprintId: string;
  format: ExportFormat;
  fileName: string;
  fileSize: number;
  exportedAt: string;
  metadata: ExportMetadata;
}

export interface ExportServiceConfig {
  defaultPageSize: 'A4' | 'Letter' | 'Legal';
  defaultOrientation: 'portrait' | 'landscape';
  defaultQuality: 'low' | 'medium' | 'high';
  maxFileSize: number; // in bytes
  enableHistory: boolean;
  maxHistoryEntries: number;
}

export interface ChartExportOptions {
  width: number;
  height: number;
  quality: number;
  backgroundColor: string;
  format: 'png' | 'jpeg';
}
