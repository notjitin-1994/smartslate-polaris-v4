import { useState, useEffect } from 'react';
import { breakpoints } from '../tokens';

type BreakpointKey = keyof typeof breakpoints;

interface UseResponsiveReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  currentBreakpoint: BreakpointKey;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Hook to handle responsive design and breakpoint detection
 */
export function useResponsive(): UseResponsiveReturn {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [screenHeight, setScreenHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    // Initial call
    handleResize();

    // Add event listener with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  // Determine current breakpoint
  const getCurrentBreakpoint = (): BreakpointKey => {
    const width = screenWidth;

    if (width >= parseInt(breakpoints.wide)) return 'wide';
    if (width >= parseInt(breakpoints.desktop)) return 'desktop';
    if (width >= parseInt(breakpoints.tablet)) return 'tablet';
    return 'mobile';
  };

  const currentBreakpoint = getCurrentBreakpoint();

  return {
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop',
    isWide: currentBreakpoint === 'wide',
    currentBreakpoint,
    screenWidth,
    screenHeight,
  };
}

/**
 * Hook to check if screen matches a specific media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener as any);
    }

    // Clean up
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener as any);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook to get adaptive layout configuration based on screen size
 */
export function useAdaptiveLayout() {
  const { currentBreakpoint } = useResponsive();

  const layouts = {
    mobile: {
      columns: 1,
      spacing: 'sm',
      containerPadding: '1rem',
      maxWidth: '100%',
      navigation: 'bottom',
      sidebarVisible: false,
    },
    tablet: {
      columns: 2,
      spacing: 'md',
      containerPadding: '1.5rem',
      maxWidth: '768px',
      navigation: 'top',
      sidebarVisible: false,
    },
    desktop: {
      columns: 3,
      spacing: 'lg',
      containerPadding: '2rem',
      maxWidth: '1200px',
      navigation: 'top',
      sidebarVisible: true,
    },
    wide: {
      columns: 4,
      spacing: 'xl',
      containerPadding: '2rem',
      maxWidth: '1440px',
      navigation: 'top',
      sidebarVisible: true,
    },
  };

  return layouts[currentBreakpoint];
}
