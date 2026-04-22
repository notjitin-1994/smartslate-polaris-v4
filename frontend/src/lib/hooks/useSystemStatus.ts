/**
 * useSystemStatus Hook
 * Manages system health checks and status data for the admin dashboard
 *
 * Features:
 * - Real-time status polling
 * - Automatic retry on failures
 * - Caching with configurable TTL
 * - Error handling and recovery
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SystemStatusData, SystemComponentType } from '@/types/system-status';

/**
 * Configuration options for system status checks
 */
interface UseSystemStatusOptions {
  /**
   * Auto-poll interval in milliseconds (0 to disable)
   * @default 60000 (1 minute)
   */
  pollInterval?: number;

  /**
   * Enable automatic polling
   * @default false
   */
  autoPoll?: boolean;

  /**
   * Components to check (empty = all)
   * @default []
   */
  components?: SystemComponentType[];

  /**
   * Callback when status changes
   */
  onStatusChange?: (component: SystemComponentType, status: SystemStatusData) => void;

  /**
   * Cache TTL in milliseconds
   * @default 30000 (30 seconds)
   */
  cacheTTL?: number;
}

/**
 * Return type for useSystemStatus hook
 */
interface UseSystemStatusReturn {
  /**
   * All system status data
   */
  statuses: Record<SystemComponentType, SystemStatusData | null>;

  /**
   * Check status for specific component
   */
  checkStatus: (component: SystemComponentType) => Promise<void>;

  /**
   * Check all components
   */
  checkAll: () => Promise<void>;

  /**
   * Loading state per component
   */
  isChecking: Record<SystemComponentType, boolean>;

  /**
   * Error state per component
   */
  errors: Record<SystemComponentType, Error | null>;

  /**
   * Refresh interval control
   */
  pausePolling: () => void;
  resumePolling: () => void;
  isPolling: boolean;
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: SystemStatusData;
  timestamp: number;
}

/**
 * System status check hook
 */
export function useSystemStatus(options: UseSystemStatusOptions = {}): UseSystemStatusReturn {
  const {
    pollInterval = 60000,
    autoPoll = false,
    components = [],
    onStatusChange,
    cacheTTL = 30000,
  } = options;

  // State
  const [statuses, setStatuses] = useState<Record<SystemComponentType, SystemStatusData | null>>({
    database: null,
    api: null,
    ai_service: null,
    authentication: null,
    storage: null,
    external_service: null,
  });

  const [isChecking, setIsChecking] = useState<Record<SystemComponentType, boolean>>({
    database: false,
    api: false,
    ai_service: false,
    authentication: false,
    storage: false,
    external_service: false,
  });

  const [errors, setErrors] = useState<Record<SystemComponentType, Error | null>>({
    database: null,
    api: null,
    ai_service: null,
    authentication: null,
    storage: null,
    external_service: null,
  });

  const [isPolling, setIsPolling] = useState(autoPoll);

  // Refs
  const cache = useRef<Record<string, CacheEntry>>({});
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback(
    (component: SystemComponentType): boolean => {
      const entry = cache.current[component];
      if (!entry) return false;

      const age = Date.now() - entry.timestamp;
      return age < cacheTTL;
    },
    [cacheTTL]
  );

  /**
   * Fetch status for a specific component
   */
  const fetchComponentStatus = async (
    component: SystemComponentType
  ): Promise<SystemStatusData> => {
    const response = await fetch(`/api/admin/system-status/${component}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${component} status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  };

  /**
   * Check status for specific component
   */
  const checkStatus = useCallback(
    async (component: SystemComponentType) => {
      // Check cache first
      if (isCacheValid(component)) {
        const cachedData = cache.current[component].data;
        setStatuses((prev) => ({ ...prev, [component]: cachedData }));
        return;
      }

      // Set loading state
      setIsChecking((prev) => ({ ...prev, [component]: true }));
      setErrors((prev) => ({ ...prev, [component]: null }));

      try {
        const statusData = await fetchComponentStatus(component);

        // Update cache
        cache.current[component] = {
          data: statusData,
          timestamp: Date.now(),
        };

        // Update state
        setStatuses((prev) => ({ ...prev, [component]: statusData }));

        // Trigger callback
        if (onStatusChange) {
          onStatusChange(component, statusData);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        setErrors((prev) => ({ ...prev, [component]: errorObj }));

        // Create error status data
        const errorStatus: SystemStatusData = {
          component,
          componentName: component,
          status: 'error',
          lastChecked: new Date().toISOString(),
          error: {
            code: 'CHECK_FAILED',
            message: errorObj.message,
            timestamp: new Date().toISOString(),
            retryable: true,
          },
        };

        setStatuses((prev) => ({ ...prev, [component]: errorStatus }));
      } finally {
        setIsChecking((prev) => ({ ...prev, [component]: false }));
      }
    },
    [isCacheValid, onStatusChange]
  );

  /**
   * Check all components
   */
  const checkAll = useCallback(async () => {
    const componentsToCheck =
      components.length > 0 ? components : (Object.keys(statuses) as SystemComponentType[]);

    await Promise.allSettled(componentsToCheck.map((component) => checkStatus(component)));
  }, [components, statuses, checkStatus]);

  /**
   * Pause polling
   */
  const pausePolling = useCallback(() => {
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Resume polling
   */
  const resumePolling = useCallback(() => {
    if (pollInterval > 0) {
      setIsPolling(true);
    }
  }, [pollInterval]);

  /**
   * Set up polling effect
   */
  useEffect(() => {
    if (!isPolling || pollInterval === 0) {
      return;
    }

    // Initial check
    checkAll();

    // Set up interval
    pollIntervalRef.current = setInterval(() => {
      checkAll();
    }, pollInterval);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, pollInterval, checkAll]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    statuses,
    checkStatus,
    checkAll,
    isChecking,
    errors,
    pausePolling,
    resumePolling,
    isPolling,
  };
}

/**
 * Utility: Get overall system health
 */
export function getOverallHealth(
  statuses: Record<SystemComponentType, SystemStatusData | null>
): 'healthy' | 'degraded' | 'critical' | 'unknown' {
  const statusValues = Object.values(statuses).filter(Boolean) as SystemStatusData[];

  if (statusValues.length === 0) return 'unknown';

  const hasError = statusValues.some((s) => s.status === 'error');
  const hasWarning = statusValues.some((s) => s.status === 'warning');
  const hasChecking = statusValues.some((s) => s.status === 'checking');

  if (hasError) return 'critical';
  if (hasWarning) return 'degraded';
  if (hasChecking) return 'unknown';
  return 'healthy';
}

/**
 * Utility: Format health percentage
 */
export function getHealthPercentage(
  statuses: Record<SystemComponentType, SystemStatusData | null>
): number {
  const statusValues = Object.values(statuses).filter(Boolean) as SystemStatusData[];

  if (statusValues.length === 0) return 0;

  const healthyCount = statusValues.filter((s) => s.status === 'success').length;
  const warningCount = statusValues.filter((s) => s.status === 'warning').length;

  // Success = 100%, Warning = 70%, Error/Checking = 0%
  const totalScore = healthyCount * 100 + warningCount * 70;
  const maxScore = statusValues.length * 100;

  return Math.round((totalScore / maxScore) * 100);
}
