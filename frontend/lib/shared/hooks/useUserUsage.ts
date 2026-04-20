'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface UserUsage {
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

interface UseUserUsageReturn {
  usage: UserUsage | null;
  loading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
}

/**
 * Custom hook to fetch user's blueprint usage statistics from the API.
 * This hook returns actual counts from the database, not cached counter columns.
 *
 * Unlike useUserProfile which fetches directly from the database,
 * this hook uses the /api/user/usage endpoint which queries actual
 * blueprint_generator records for accurate counts.
 */
export function useUserUsage(): UseUserUsageReturn {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    console.log('[useUserUsage] fetchUsage called', { userId: user?.id });

    // Don't fetch if user is not authenticated
    if (!user?.id) {
      console.log('[useUserUsage] Skipping fetch - not authenticated');
      setUsage(null);
      setLoading(false);
      return;
    }

    console.log('[useUserUsage] Starting fetch to /api/user/usage');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      });

      console.log('[useUserUsage] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch usage data');
      }

      const data = await response.json();

      console.log('[useUserUsage] Response data:', JSON.stringify(data, null, 2));

      if (!data.success || !data.usage) {
        throw new Error('Invalid response from usage API');
      }

      console.log('[useUserUsage] Setting usage state:', JSON.stringify(data.usage, null, 2));
      setUsage(data.usage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage data';
      console.error('[useUserUsage] Error:', errorMessage);
      setError(errorMessage);

      // Set default values on error to prevent UI from breaking
      setUsage({
        creationCount: 0,
        savingCount: 0,
        creationLimit: 2,
        savingLimit: 2,
        creationRemaining: 2,
        savingRemaining: 2,
        isExempt: false,
        subscriptionTier: 'free',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    fetchUsage();
  }, [user?.id]); // Use user.id directly instead of fetchUsage function

  return {
    usage,
    loading,
    error,
    refreshUsage,
  };
}
