import { useState, useEffect } from 'react';

/**
 * Custom React hooks for admin reports functionality
 * Handles API calls to backend report endpoints
 */

export interface Report {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_by: string;
  generated_at: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  filters: Record<string, any>;
  parameters: Record<string, any>;
  data: any;
  file_size_bytes: number | null;
  file_url: string | null;
  export_formats: string[];
  generation_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportStats {
  summary: {
    totalReports: number;
    completedReports: number;
    failedReports: number;
    pendingReports: number;
    processingReports: number;
    successRate: string;
    avgGenerationTimeMs: number;
    totalFileSizeBytes: number;
  };
  reportsByType: Record<string, number>;
  reportsByStatus: {
    completed: number;
    failed: number;
    pending: number;
    processing: number;
  };
  topGenerators: Array<{ userId: string; count: number }>;
  dailyStats: any[];
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
}

export interface ReportsListResponse {
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GenerateReportRequest {
  name: string;
  type:
    | 'user-activity'
    | 'cost-analysis'
    | 'system-performance'
    | 'blueprint-generation'
    | 'api-usage'
    | 'security-audit';
  dateRangeStart?: string;
  dateRangeEnd?: string;
  filters?: Record<string, any>;
  parameters?: Record<string, any>;
  exportFormats?: Array<'pdf' | 'excel' | 'csv' | 'json'>;
}

/**
 * Hook to fetch list of reports with pagination
 */
export function useReports(
  page = 1,
  limit = 10,
  type?: string,
  status?: string,
  sortBy = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (type) params.append('type', type);
      if (status) params.append('status', status);

      const response = await fetch(`/api/admin/reports?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reports');
      }

      const data: ReportsListResponse = await response.json();
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, limit, type, status, sortBy, sortOrder]);

  return {
    reports,
    pagination,
    loading,
    error,
    refetch: fetchReports,
  };
}

/**
 * Hook to fetch report statistics
 */
export function useReportStats(days = 30) {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reports/stats?days=${days}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report statistics');
      }

      const data: ReportStats = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching report stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook to generate a new report
 */
export function useGenerateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);

  const generateReport = async (request: GenerateReportRequest): Promise<Report | null> => {
    setLoading(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setGeneratedReport(data.report);
      return data.report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error generating report:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateReport,
    loading,
    error,
    generatedReport,
  };
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReport = async (reportId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete report');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting report:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteReport,
    loading,
    error,
  };
}

/**
 * Hook to fetch a single report by ID
 */
export function useReport(reportId: string | null) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  return {
    report,
    loading,
    error,
    refetch: fetchReport,
  };
}
