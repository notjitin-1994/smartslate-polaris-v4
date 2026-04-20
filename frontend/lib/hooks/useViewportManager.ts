'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface ViewportState {
  /**
   * Current viewport width in pixels
   */
  width: number;

  /**
   * Current viewport height in pixels
   */
  height: number;

  /**
   * Device pixel ratio
   */
  devicePixelRatio: number;

  /**
   * Current orientation
   */
  orientation: 'portrait' | 'landscape';

  /**
   * Whether the device is mobile
   */
  isMobile: boolean;

  /**
   * Whether the device is tablet
   */
  isTablet: boolean;

  /**
   * Whether the device is desktop
   */
  isDesktop: boolean;

  /**
   * Safe area insets for notched devices
   */
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /**
   * Visual viewport API support
   */
  visualViewportSupported: boolean;

  /**
   * Touch support detection
   */
  isTouchDevice: boolean;
}

export interface UseViewportManagerOptions {
  /**
   * Debounce delay for resize events (ms)
   * @default 150
   */
  debounceDelay?: number;

  /**
   * Breakpoint definitions for device classification
   */
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  /**
   * Whether to listen for orientation changes
   * @default true
   */
  listenToOrientation?: boolean;

  /**
   * Whether to listen for visual viewport changes (if supported)
   * @default true
   */
  listenToVisualViewport?: boolean;
}

/**
 * Default breakpoint configurations
 */
const DEFAULT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

/**
 * Custom hook for comprehensive viewport management with device classification and orientation detection
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const viewport = useViewportManager()
 *
 *   return (
 *     <div>
 *       <p>Device: {viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'}</p>
 *       <p>Orientation: {viewport.orientation}</p>
 *       <p>Safe area top: {viewport.safeAreaInsets.top}px</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useViewportManager(options: UseViewportManagerOptions = {}): ViewportState {
  const {
    debounceDelay = 150,
    breakpoints = DEFAULT_BREAKPOINTS,
    listenToOrientation = true,
    listenToVisualViewport = true,
  } = options;

  const [viewportState, setViewportState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        devicePixelRatio: 1,
        orientation: 'landscape' as const,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        visualViewportSupported: false,
        isTouchDevice: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width >= height ? 'landscape' : 'portrait';

    // Device classification based on width
    const isMobile = width < breakpoints.mobile;
    const isTablet = width >= breakpoints.mobile && width < breakpoints.desktop;
    const isDesktop = width >= breakpoints.desktop;

    return {
      width,
      height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation,
      isMobile,
      isTablet,
      isDesktop,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }, // Will be updated by useSafeAreaInsets
      visualViewportSupported: 'visualViewport' in window,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
  });

  // Debounced resize handler
  const debouncedResizeHandler = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          const width = window.innerWidth;
          const height = window.innerHeight;
          const orientation = width >= height ? 'landscape' : 'portrait';

          // Device classification based on width
          const isMobile = width < breakpoints.mobile;
          const isTablet = width >= breakpoints.mobile && width < breakpoints.desktop;
          const isDesktop = width >= breakpoints.desktop;

          setViewportState((prev) => ({
            ...prev,
            width,
            height,
            orientation,
            isMobile,
            isTablet,
            isDesktop,
          }));
        }
      }, debounceDelay);
    };
  }, [debounceDelay, breakpoints]);

  // Handle orientation changes
  const handleOrientationChange = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width >= height ? 'landscape' : 'portrait';

      // Device classification based on width
      const isMobile = width < breakpoints.mobile;
      const isTablet = width >= breakpoints.mobile && width < breakpoints.desktop;
      const isDesktop = width >= breakpoints.desktop;

      setViewportState((prev) => ({
        ...prev,
        width,
        height,
        orientation,
        isMobile,
        isTablet,
        isDesktop,
      }));
    }
  }, [breakpoints]);

  // Handle visual viewport changes (if supported)
  const handleVisualViewportChange = useCallback(() => {
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const width = visualViewport.width;
        const height = visualViewport.height;
        const orientation = width >= height ? 'landscape' : 'portrait';

        // Device classification based on visual viewport width
        const isMobile = width < breakpoints.mobile;
        const isTablet = width >= breakpoints.mobile && width < breakpoints.desktop;
        const isDesktop = width >= breakpoints.desktop;

        setViewportState((prev) => ({
          ...prev,
          width,
          height,
          orientation,
          isMobile,
          isTablet,
          isDesktop,
        }));
      }
    }
  }, [breakpoints]);

  // Setup event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', debouncedResizeHandler);
    if (listenToOrientation) {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Visual viewport API support (Chrome 61+, Safari 13+)
    if (listenToVisualViewport && 'visualViewport' in window) {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        visualViewport.addEventListener('resize', handleVisualViewportChange);
      }
    }

    return () => {
      window.removeEventListener('resize', debouncedResizeHandler);
      if (listenToOrientation) {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }

      if (listenToVisualViewport && 'visualViewport' in window) {
        const visualViewport = window.visualViewport;
        if (visualViewport) {
          visualViewport.removeEventListener('resize', handleVisualViewportChange);
        }
      }
    };
  }, [
    debouncedResizeHandler,
    handleOrientationChange,
    handleVisualViewportChange,
    listenToOrientation,
    listenToVisualViewport,
  ]);

  // Update safe area insets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);

      const safeAreaInsets = {
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      };

      setViewportState((prev) => ({
        ...prev,
        safeAreaInsets,
      }));
    };

    updateSafeAreaInsets();

    // Listen for safe area changes (though this is rare)
    const observer = new MutationObserver(updateSafeAreaInsets);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  return viewportState;
}

/**
 * Hook for safe area inset handling
 */
export function useSafeAreaInsets() {
  const { safeAreaInsets } = useViewportManager();

  return safeAreaInsets;
}

/**
 * Hook for device type detection
 */
export function useDeviceType() {
  const { isMobile, isTablet, isDesktop } = useViewportManager();

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

/**
 * Hook for orientation detection
 */
export function useOrientation() {
  const { orientation, width, height } = useViewportManager();

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    aspectRatio: width / height,
  };
}

/**
 * Hook for touch device detection
 */
export function useTouchDevice() {
  const { isTouchDevice } = useViewportManager();

  return {
    isTouchDevice,
    hasTouchSupport: isTouchDevice,
  };
}
