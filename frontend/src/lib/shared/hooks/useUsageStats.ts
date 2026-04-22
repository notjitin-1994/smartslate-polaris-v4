'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Usage statistics interface matching API response
 */
export interface UsageStats {
  creationCount: number;
  savingCount: number;
  creationLimit: number;
  savingLimit: number;
  creationRemaining: number;
  savingRemaining: number;
  isExempt: boolean;
  exemptionReason?: string;
  subscriptionTier: string;
}

interface UseUsageStatsReturn {
  usage: UsageStats | null;
  loading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
  isCreationLimitReached: boolean;
  isSavingLimitReached: boolean;
  creationPercentage: number;
  savingPercentage: number;
}

/**
 * Hook for fetching and managing blueprint usage statistics
 *
 * Features:
 * - Fetches usage data from /api/user/usage
 * - Caches data with automatic refresh
 * - Provides computed values (percentages, limit checks)
 * - Exposes refresh function for manual updates
 *
 * Usage:
 * ```tsx
 * const { usage, loading, refreshUsage } = useUsageStats();
 *
 * // After creating a blueprint:
 * await refreshUsage();
 * ```
 */
export function useUsageStats(options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}): UseUsageStatsReturn {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { autoRefresh = true, refreshInterval = 60000 } = options || {};

  /**
   * Fetch usage statistics from API
   */
  const fetchUsage = useCallback(async () => {
    if (!user?.id) {
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please log in again');
        }
        throw new Error(`Failed to fetch usage: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch usage statistics');
      }

      setUsage(data.usage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage';
      console.error('Usage fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Manual refresh function exposed to consumers
   */
  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  // Initial fetch on mount or when user changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Auto-refresh interval (optional)
  useEffect(() => {
    if (!autoRefresh || !user?.id) return;

    const interval = setInterval(() => {
      fetchUsage();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user?.id, fetchUsage]);

  // Computed values
  const isCreationLimitReached = usage ? usage.creationCount >= usage.creationLimit : false;
  const isSavingLimitReached = usage ? usage.savingCount >= usage.savingLimit : false;

  const creationPercentage =
    usage && usage.creationLimit > 0 ? (usage.creationCount / usage.creationLimit) * 100 : 0;

  const savingPercentage =
    usage && usage.savingLimit > 0 ? (usage.savingCount / usage.savingLimit) * 100 : 0;

  return {
    usage,
    loading,
    error,
    refreshUsage,
    isCreationLimitReached,
    isSavingLimitReached,
    creationPercentage,
    savingPercentage,
  };
}

/**
 * Check if an error is a 429 limit exceeded error
 */
export function isLimitExceededError(error: any): boolean {
  if (!error) return false;

  // Check for API response format
  if (error.limitExceeded === true) return true;

  // Check for HTTP 429 status
  if (error.status === 429 || error.statusCode === 429) return true;

  // Check for error message patterns
  const message = error.message || error.error || '';
  if (typeof message === 'string') {
    return (
      message.includes('limit') && (message.includes('reached') || message.includes('exceeded'))
    );
  }

  return false;
}

/**
 * Extract limit type from error (creation or saving)
 */
export function getLimitTypeFromError(error: any): 'creation' | 'saving' | 'unknown' {
  const message = error.message || error.error || '';
  if (typeof message === 'string') {
    if (message.toLowerCase().includes('creation')) return 'creation';
    if (message.toLowerCase().includes('saving') || message.toLowerCase().includes('save'))
      return 'saving';
  }
  return 'unknown';
}
