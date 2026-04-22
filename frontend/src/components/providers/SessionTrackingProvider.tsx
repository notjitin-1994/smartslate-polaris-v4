'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Session Tracking Provider
 *
 * Automatically initializes and manages user session tracking
 * Tracks page views on route changes
 */
export function SessionTrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const initializingRef = useRef(false);

  /**
   * Initialize session
   */
  const initSession = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        sessionIdRef.current = data.session.id;
        console.log('Session initialized:', data.session.id);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      initializingRef.current = false;
    }
  };

  /**
   * Track page view
   */
  const trackPageView = async () => {
    if (!sessionIdRef.current) {
      await initSession();
      if (!sessionIdRef.current) return;
    }

    try {
      await fetch(`/api/sessions/${sessionIdRef.current}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_view: true }),
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  /**
   * End session on page unload
   */
  const endSession = async () => {
    if (!sessionIdRef.current) return;

    try {
      // Use sendBeacon for reliable tracking on page unload
      const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
      navigator.sendBeacon(`/api/sessions/${sessionIdRef.current}`, blob);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    initSession();

    // End session on page unload
    window.addEventListener('beforeunload', endSession);

    return () => {
      window.removeEventListener('beforeunload', endSession);
    };
  }, []);

  // Track page view on route change
  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return <>{children}</>;
}
