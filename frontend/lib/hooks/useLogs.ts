/**
 * Custom hook for fetching and managing logs
 * Handles filtering, pagination, auto-refresh, and exports
 */

import { useCallback, useEffect, useState } from 'react';
import { LogEntry, LogLevel, LogService, LogStats } from '@/lib/logging/types';

export interface LogFilters {
  levels: LogLevel[];
  services: LogService[];
  events: string[];
  search: string;
  from: string;
  to: string;
  userId?: string;
  blueprintId?: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  stats: LogStats;
  total: number;
  filters: Partial<LogFilters>;
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface UseLogsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  limit?: number;
  offset?: number;
}

export function useLogs(options: UseLogsOptions = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 5000,
    limit = 10, // Changed from 100 to 10 for pagination
    offset = 0,
  } = options;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);

  // Filters
  const [filters, setFilters] = useState<LogFilters>({
    levels: [],
    services: [],
    events: [],
    search: '',
    from: '',
    to: '',
  });

  // Pagination
  const [currentLimit, setCurrentLimit] = useState(limit);
  const [currentOffset, setCurrentOffset] = useState(offset);

  /**
   * Fetch logs from API
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();

      if (filters.levels.length > 0) {
        params.set('level', filters.levels.join(','));
      }

      if (filters.services.length > 0) {
        params.set('service', filters.services.join(','));
      }

      if (filters.events.length > 0) {
        params.set('event', filters.events.join(','));
      }

      if (filters.search) {
        params.set('search', filters.search);
      }

      if (filters.from) {
        params.set('from', filters.from);
      }

      if (filters.to) {
        params.set('to', filters.to);
      }

      if (filters.userId) {
        params.set('userId', filters.userId);
      }

      if (filters.blueprintId) {
        params.set('blueprintId', filters.blueprintId);
      }

      params.set('limit', currentLimit.toString());
      params.set('offset', currentOffset.toString());

      const response = await fetch(`/api/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data: LogsResponse = await response.json();

      setLogs(data.logs);
      setStats(data.stats);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentLimit, currentOffset]);

  /**
   * Export logs in specified format
   */
  const exportLogs = useCallback(
    async (format: 'csv' | 'json' | 'txt') => {
      try {
        // Build query params
        const params = new URLSearchParams();

        if (filters.levels.length > 0) {
          params.set('level', filters.levels.join(','));
        }

        if (filters.services.length > 0) {
          params.set('service', filters.services.join(','));
        }

        if (filters.events.length > 0) {
          params.set('event', filters.events.join(','));
        }

        if (filters.search) {
          params.set('search', filters.search);
        }

        if (filters.from) {
          params.set('from', filters.from);
        }

        if (filters.to) {
          params.set('to', filters.to);
        }

        params.set('format', format);
        params.set('limit', '10000'); // Export more records

        const response = await fetch(`/api/logs?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to export logs: ${response.statusText}`);
        }

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return { success: true };
      } catch (err) {
        console.error('Error exporting logs:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to export logs',
        };
      }
    },
    [filters]
  );

  /**
   * Clear all logs
   */
  const clearLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.statusText}`);
      }

      // Refresh logs after clearing
      await fetchLogs();

      return { success: true };
    } catch (err) {
      console.error('Error clearing logs:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to clear logs',
      };
    }
  }, [fetchLogs]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: Partial<LogFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentOffset(0); // Reset to first page when filters change
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      levels: [],
      services: [],
      events: [],
      search: '',
      from: '',
      to: '',
    });
    setCurrentOffset(0);
  }, []);

  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((prev) => !prev);
  }, []);

  /**
   * Pagination controls
   */
  const goToNextPage = useCallback(() => {
    setCurrentOffset((prev) => prev + currentLimit);
  }, [currentLimit]);

  const goToPreviousPage = useCallback(() => {
    setCurrentOffset((prev) => Math.max(0, prev - currentLimit));
  }, [currentLimit]);

  const setLimit = useCallback((newLimit: number) => {
    setCurrentLimit(newLimit);
    setCurrentOffset(0); // Reset to first page
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      return;
    }

    const interval = setInterval(() => {
      fetchLogs();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, refreshInterval, fetchLogs]);

  return {
    logs,
    stats,
    total,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    exportLogs,
    clearLogs,
    refresh: fetchLogs,
    isAutoRefreshEnabled,
    toggleAutoRefresh,
    pagination: {
      limit: currentLimit,
      offset: currentOffset,
      currentPage: Math.floor(currentOffset / currentLimit) + 1,
      totalPages: Math.ceil(total / currentLimit),
      hasNextPage: currentOffset + currentLimit < total,
      hasPreviousPage: currentOffset > 0,
      goToNextPage,
      goToPreviousPage,
      setLimit,
    },
  };
}
