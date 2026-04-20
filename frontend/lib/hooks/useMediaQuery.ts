/**
 * useMediaQuery Hook
 * Monitors responsive breakpoints for SmartSlate Polaris
 * Mobile-first responsive system
 */

'use client';

import { useState, useEffect } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface MediaQueries {
  isMobile: boolean; // < 640px
  isTablet: boolean; // 640px - 1023px
  isDesktop: boolean; // >= 1024px
  isSm: boolean; // >= 640px
  isMd: boolean; // >= 768px
  isLg: boolean; // >= 1024px
  isXl: boolean; // >= 1280px
  is2Xl: boolean; // >= 1536px
}

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useMediaQuery(): MediaQueries {
  const [queries, setQueries] = useState<MediaQueries>(() => {
    // SSR-safe default values
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSm: true,
        isMd: true,
        isLg: true,
        isXl: true,
        is2Xl: true,
      };
    }

    const width = window.innerWidth;
    return {
      isMobile: width < breakpoints.sm,
      isTablet: width >= breakpoints.sm && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg,
      isSm: width >= breakpoints.sm,
      isMd: width >= breakpoints.md,
      isLg: width >= breakpoints.lg,
      isXl: width >= breakpoints.xl,
      is2Xl: width >= breakpoints['2xl'],
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setQueries({
        isMobile: width < breakpoints.sm,
        isTablet: width >= breakpoints.sm && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
        isSm: width >= breakpoints.sm,
        isMd: width >= breakpoints.md,
        isLg: width >= breakpoints.lg,
        isXl: width >= breakpoints.xl,
        is2Xl: width >= breakpoints['2xl'],
      });
    };

    // Debounce resize events for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return queries;
}

/**
 * Hook to check a specific breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= breakpoints[breakpoint];
  });

  useEffect(() => {
    const handleResize = () => {
      setMatches(window.innerWidth >= breakpoints[breakpoint]);
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return matches;
}

/**
 * Hook for touch device detection
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}
