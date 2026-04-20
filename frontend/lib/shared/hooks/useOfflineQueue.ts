/**
 * useOfflineQueue Hook
 * React hook for offline detection and queued request management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineQueue } from '@/lib/offline/offlineQueue';

interface UseOfflineQueueReturn {
  isOnline: boolean;
  queuedCount: number;
  queueRequest: (
    url: string,
    options?: RequestInit
  ) => Promise<{ queued: true; queueId: string } | Response>;
  clearQueue: () => void;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Subscribe to online/offline status changes
    const unsubscribe = offlineQueue.subscribe((online) => {
      setIsOnline(online);
      setQueuedCount(offlineQueue.getQueuedCount());
    });

    // Initialize state
    setIsOnline(offlineQueue.getOnlineStatus());
    setQueuedCount(offlineQueue.getQueuedCount());

    // Update queued count periodically
    const interval = setInterval(() => {
      setQueuedCount(offlineQueue.getQueuedCount());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const queueRequest = useCallback(async (url: string, options?: RequestInit) => {
    const result = await offlineQueue.queueRequest(url, options);
    setQueuedCount(offlineQueue.getQueuedCount());
    return result;
  }, []);

  const clearQueue = useCallback(() => {
    offlineQueue.clearQueue();
    setQueuedCount(0);
  }, []);

  return {
    isOnline,
    queuedCount,
    queueRequest,
    clearQueue,
  };
}
