'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { SessionActivity } from '@/types/session';

/**
 * Custom hook for session tracking
 *
 * Automatically tracks page views and provides methods for tracking other activities
 */
export function useSessionTracking(options?: { trackPageViews?: boolean; trackActions?: boolean }) {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const trackPageViews = options?.trackPageViews ?? true;

  /**
   * Initialize or get current session
   */
  const initSession = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.session.id;
        return data.session.id;
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
    return null;
  }, []);

  /**
   * Update session activity
   */
  const updateActivity = useCallback(
    async (activity: SessionActivity) => {
      if (!sessionIdRef.current) {
        const sessionId = await initSession();
        if (!sessionId) return;
      }

      try {
        await fetch(`/api/sessions/${sessionIdRef.current}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activity),
        });
      } catch (error) {
        console.error('Failed to update session activity:', error);
      }
    },
    [initSession]
  );

  /**
   * Track page view
   */
  const trackPageView = useCallback(async () => {
    await updateActivity({ page_view: true });
  }, [updateActivity]);

  /**
   * Track action
   */
  const trackAction = useCallback(async () => {
    await updateActivity({ action: true });
  }, [updateActivity]);

  /**
   * Track blueprint creation
   */
  const trackBlueprintCreation = useCallback(async () => {
    await updateActivity({ blueprint_created: true });
  }, [updateActivity]);

  /**
   * Track blueprint view
   */
  const trackBlueprintView = useCallback(async () => {
    await updateActivity({ blueprint_viewed: true });
  }, [updateActivity]);

  /**
   * End current session
   */
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await fetch(`/api/sessions/${sessionIdRef.current}`, {
        method: 'DELETE',
      });
      sessionIdRef.current = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Track page views on route change
  useEffect(() => {
    if (trackPageViews) {
      trackPageView();
    }
  }, [pathname, trackPageViews, trackPageView]);

  return {
    trackPageView,
    trackAction,
    trackBlueprintCreation,
    trackBlueprintView,
    endSession,
  };
}
