'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface BreakpointConfig {
  name: string;
  minWidth: number;
  maxWidth?: number;
  layout: {
    columns: number;
    spacing: 'tight' | 'normal' | 'loose';
    density: 'compact' | 'normal' | 'spacious';
    fontScale: number;
  };
}

export interface ResponsiveContentState {
  /**
   * Current breakpoint name
   */
  breakpoint: string;

  /**
   * Current breakpoint configuration
   */
  breakpointConfig: BreakpointConfig;

  /**
   * Current viewport width
   */
  width: number;

  /**
   * Current viewport height
   */
  height: number;

  /**
   * Whether current breakpoint is mobile
   */
  isMobile: boolean;

  /**
   * Whether current breakpoint is tablet
   */
  isTablet: boolean;

  /**
   * Whether current breakpoint is desktop
   */
  isDesktop: boolean;

  /**
   * Layout configuration for current breakpoint
   */
  layout: BreakpointConfig['layout'];
}

export interface UseResponsiveContentOptions {
  /**
   * Custom breakpoint configurations
   */
  breakpoints?: BreakpointConfig[];

  /**
   * Debounce delay for resize events (ms)
   * @default 150
   */
  debounceDelay?: number;

  /**
   * Whether to listen for orientation changes
   * @default true
   */
  listenToOrientation?: boolean;
}

/**
 * Default breakpoint configurations following mobile-first design
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig[] = [
  {
    name: 'mobile-compact',
    minWidth: 0,
    maxWidth: 374,
    layout: {
      columns: 1,
      spacing: 'tight',
      density: 'compact',
      fontScale: 0.875, // Smaller text for compact screens
    },
  },
  {
    name: 'mobile-expanded',
    minWidth: 375,
    maxWidth: 767,
    layout: {
      columns: 1,
      spacing: 'normal',
      density: 'normal',
      fontScale: 0.9375, // Slightly larger than compact
    },
  },
  {
    name: 'tablet',
    minWidth: 768,
    maxWidth: 1023,
    layout: {
      columns: 2,
      spacing: 'normal',
      density: 'normal',
      fontScale: 1, // Standard scale
    },
  },
  {
    name: 'desktop',
    minWidth: 1024,
    layout: {
      columns: 3,
      spacing: 'loose',
      density: 'spacious',
      fontScale: 1.0625, // Slightly larger for desktop readability
    },
  },
];

/**
 * Custom hook for responsive content management with breakpoint-based layout adaptation
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const responsive = useResponsiveContent()
 *
 *   return (
 *     <div
 *       style={{
 *         gridTemplateColumns: `repeat(${responsive.layout.columns}, 1fr)`,
 *         gap: responsive.layout.spacing === 'tight' ? '8px' : responsive.layout.spacing === 'normal' ? '16px' : '24px',
 *       }}
 *     >
 *       {responsive.isMobile ? (
 *         <MobileLayout />
 *       ) : (
 *         <DesktopLayout />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useResponsiveContent(
  options: UseResponsiveContentOptions = {}
): ResponsiveContentState {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    debounceDelay = 150,
    listenToOrientation = true,
  } = options;

  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  // Debounced resize handler
  const debouncedResizeHandler = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }
      }, debounceDelay);
    };
  }, [debounceDelay]);

  // Find current breakpoint based on width
  const currentBreakpoint = useMemo(() => {
    return (
      breakpoints.find((bp) => {
        const withinMin = dimensions.width >= bp.minWidth;
        const withinMax = bp.maxWidth ? dimensions.width <= bp.maxWidth : true;
        return withinMin && withinMax;
      }) || breakpoints[breakpoints.length - 1]
    ); // Fallback to largest breakpoint
  }, [dimensions.width, breakpoints]);

  // Calculate responsive state
  const responsiveState = useMemo((): ResponsiveContentState => {
    const isMobile = currentBreakpoint.name.startsWith('mobile');
    const isTablet = currentBreakpoint.name === 'tablet';
    const isDesktop = currentBreakpoint.name === 'desktop';

    return {
      breakpoint: currentBreakpoint.name,
      breakpointConfig: currentBreakpoint,
      width: dimensions.width,
      height: dimensions.height,
      isMobile,
      isTablet,
      isDesktop,
      layout: currentBreakpoint.layout,
    };
  }, [currentBreakpoint, dimensions]);

  // Resize observer for more precise dimension tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === window.document.body) {
          debouncedResizeHandler();
          break;
        }
      }
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, [debouncedResizeHandler]);

  // Window resize listener as fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', debouncedResizeHandler);
    if (listenToOrientation) {
      window.addEventListener('orientationchange', debouncedResizeHandler);
    }

    return () => {
      window.removeEventListener('resize', debouncedResizeHandler);
      if (listenToOrientation) {
        window.removeEventListener('orientationchange', debouncedResizeHandler);
      }
    };
  }, [debouncedResizeHandler, listenToOrientation]);

  return responsiveState;
}

/**
 * Utility function to get responsive spacing value based on breakpoint
 */
export function getResponsiveSpacing(spacing: 'tight' | 'normal' | 'loose'): string {
  switch (spacing) {
    case 'tight':
      return '8px';
    case 'normal':
      return '16px';
    case 'loose':
      return '24px';
    default:
      return '16px';
  }
}

/**
 * Utility function to get responsive font scale multiplier
 */
export function getResponsiveFontScale(fontScale: number): number {
  return fontScale;
}

/**
 * Hook for responsive conditional rendering
 */
export function useResponsiveRender() {
  const responsive = useResponsiveContent();

  return {
    showOnMobile: responsive.isMobile,
    showOnTablet: responsive.isTablet,
    showOnDesktop: responsive.isDesktop,
    showOnMobileOnly: responsive.isMobile && !responsive.isTablet,
    showOnTabletAndUp: responsive.isTablet || responsive.isDesktop,
    hideOnMobile: !responsive.isMobile,
    hideOnDesktop: !responsive.isDesktop,
  };
}
