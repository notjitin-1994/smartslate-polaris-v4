/**
 * Mobile-First Responsive Design System for SmartSlate Polaris v3
 *
 * This module provides a comprehensive responsive breakpoint system
 * designed from mobile-first principles, ensuring optimal user experiences
 * across all device sizes and orientations.
 */

// ========================================
// BREAKPOINT CONSTANTS
// ========================================

/**
 * Mobile-first breakpoint definitions
 * Based on common device sizes and optimal reading/viewing experiences
 */
export const BREAKPOINTS = {
  xs: '320px', // Small phones (iPhone SE, etc.)
  sm: '640px', // Standard phones (iPhone 12/13, etc.)
  md: '768px', // Tablets (iPad Mini, etc.)
  lg: '1024px', // Small laptops (MacBook Air 13", etc.)
  xl: '1280px', // Desktops (MacBook Pro 16", etc.)
  '2xl': '1536px', // Large screens (4K displays, etc.)
} as const;

/**
 * Type-safe breakpoint keys
 */
export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Breakpoint values in pixels for JavaScript calculations
 */
export const BREAKPOINT_VALUES = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Device classification based on breakpoints
 */
export type DeviceType =
  | 'mobile-compact'
  | 'mobile-expanded'
  | 'tablet'
  | 'desktop'
  | 'large-desktop';

/**
 * Responsive breakpoint ranges for media queries
 */
export const BREAKPOINT_RANGES = {
  xs: '(min-width: 320px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

// ========================================
// RESPONSIVE UTILITY FUNCTIONS
// ========================================

/**
 * Get current device type based on viewport width
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINT_VALUES.sm) return 'mobile-compact';
  if (width < BREAKPOINT_VALUES.md) return 'mobile-expanded';
  if (width < BREAKPOINT_VALUES.lg) return 'tablet';
  if (width < BREAKPOINT_VALUES.xl) return 'desktop';
  return 'large-desktop';
}

/**
 * Get optimal column count for grid layouts based on device type
 */
export function getOptimalColumnCount(deviceType: DeviceType): number {
  const columnMap = {
    'mobile-compact': 1,
    'mobile-expanded': 2,
    tablet: 2,
    desktop: 3,
    'large-desktop': 4,
  };

  return columnMap[deviceType];
}

/**
 * Get optimal spacing scale for current device type
 */
export function getOptimalSpacing(deviceType: DeviceType): {
  component: string;
  section: string;
  content: string;
} {
  const spacingMap = {
    'mobile-compact': {
      component: 'space-y-3',
      section: 'space-y-4',
      content: 'space-y-2',
    },
    'mobile-expanded': {
      component: 'space-y-4',
      section: 'space-y-6',
      content: 'space-y-3',
    },
    tablet: {
      component: 'space-y-5',
      section: 'space-y-8',
      content: 'space-y-4',
    },
    desktop: {
      component: 'space-y-6',
      section: 'space-y-10',
      content: 'space-y-5',
    },
    'large-desktop': {
      component: 'space-y-8',
      section: 'space-y-12',
      content: 'space-y-6',
    },
  };

  return spacingMap[deviceType];
}

// ========================================
// RESPONSIVE CLASS COLLECTIONS
// ========================================

/**
 * Mobile-first responsive utility classes
 * Designed to work seamlessly with Tailwind CSS v4
 */
export const responsiveClasses = {
  // ========================================
  // CONTAINER PATTERNS
  // ========================================

  /**
   * Standard responsive container with fluid behavior
   */
  container: 'w-full max-w-none px-4 sm:px-6 lg:px-8',

  /**
   * Narrow container for focused content (max-width: 1024px)
   */
  containerNarrow: 'w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',

  /**
   * Wide container for full-width layouts (max-width: 1280px)
   */
  containerWide: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  /**
   * Standard header container with consistent width
   */
  headerContainer: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  /**
   * Full-width container for hero sections and banners
   */
  containerFull: 'w-full px-4 sm:px-6 lg:px-8',

  /**
   * Mobile-optimized container with reduced padding
   */
  containerMobile: 'w-full px-3 sm:px-4 md:px-6 lg:px-8',

  // ========================================
  // GRID PATTERNS
  // ========================================

  /**
   * Auto-responsive grid that adapts column count by screen size
   */
  gridResponsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',

  /**
   * Card-specific grid with optimal spacing for content cards
   */
  gridCards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8',

  /**
   * Dashboard grid for KPI cards and metrics
   */
  gridDashboard: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',

  /**
   * Form grid for input fields
   */
  gridForm: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',

  /**
   * Navigation grid for menu items
   */
  gridNav: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3',

  // ========================================
  // TYPOGRAPHY SCALE
  // ========================================

  textResponsive: {
    /**
     * Display text (hero titles, page headers)
     */
    display: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',

    /**
     * Title text (section headers, card titles)
     */
    title: 'text-lg sm:text-xl lg:text-2xl',

    /**
     * Heading text (subsection headers, component titles)
     */
    heading: 'text-base sm:text-lg lg:text-xl',

    /**
     * Body text (paragraphs, descriptions)
     */
    body: 'text-sm sm:text-base',

    /**
     * Caption text (metadata, secondary info)
     */
    caption: 'text-xs sm:text-sm',

    /**
     * Small text (labels, footnotes)
     */
    small: 'text-xs leading-relaxed',

    /**
     * Large display text for hero sections
     */
    hero: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
  },

  // ========================================
  // SPACING PATTERNS
  // ========================================

  spacing: {
    /**
     * Section spacing (between major content areas)
     */
    section: 'py-8 sm:py-12 lg:py-16',

    /**
     * Component spacing (between UI components)
     */
    component: 'py-4 sm:py-6 lg:py-8',

    /**
     * Content spacing (between content elements)
     */
    content: 'py-3 sm:py-4 lg:py-6',

    /**
     * Tight spacing (minimal spacing for compact layouts)
     */
    tight: 'py-2 sm:py-3',

    /**
     * Mobile-optimized spacing
     */
    mobile: 'py-4 sm:py-6',

    /**
     * Desktop-enhanced spacing
     */
    desktop: 'py-6 sm:py-8 lg:py-12',
  },

  // ========================================
  // LAYOUT PATTERNS
  // ========================================

  /**
   * Mobile-first flex patterns
   */
  flex: {
    /**
     * Column layout (mobile-first, stacks vertically)
     */
    column: 'flex flex-col',

    /**
     * Row layout (responsive, flows horizontally on larger screens)
     */
    row: 'flex flex-col sm:flex-row',

    /**
     * Responsive flex wrap
     */
    wrap: 'flex flex-wrap gap-2 sm:gap-3',

    /**
     * Center-aligned flex container
     */
    center: 'flex items-center justify-center',

    /**
     * Space-between layout
     */
    between: 'flex items-center justify-between',

    /**
     * Mobile-friendly button group
     */
    buttonGroup: 'flex flex-col sm:flex-row gap-2 sm:gap-3',
  },

  // ========================================
  // MOBILE-SPECIFIC PATTERNS
  // ========================================

  /**
   * Mobile-optimized card layouts
   */
  card: {
    /**
     * Standard card with mobile-first responsive padding
     */
    standard: 'rounded-xl p-4 sm:p-6',

    /**
     * Compact card for mobile screens
     */
    compact: 'rounded-lg p-3 sm:p-4',

    /**
     * Large card for desktop emphasis
     */
    large: 'rounded-2xl p-6 sm:p-8 lg:p-10',

    /**
     * Mobile-friendly card with reduced padding
     */
    mobile: 'rounded-lg p-3',
  },

  /**
   * Mobile navigation patterns
   */
  navigation: {
    /**
     * Mobile menu button with proper touch targets
     */
    menuButton: 'min-h-[44px] min-w-[44px]',

    /**
     * Mobile navigation item with touch optimization
     */
    navItem: 'min-h-[48px] px-4 py-3',

    /**
     * Mobile drawer/sheet pattern
     */
    drawer: 'w-80 sm:w-96 max-w-[85vw]',
  },

  // ========================================
  // PERFORMANCE PATTERNS
  // ========================================

  /**
   * Performance-optimized animation classes
   */
  animation: {
    /**
     * Fast animations for mobile devices
     */
    mobile: 'transition-all duration-200 ease-out',

    /**
     * Standard animations for desktop
     */
    desktop: 'transition-all duration-300 ease-out',

    /**
     * Touch-optimized hover effects
     */
    touchHover: 'active:scale-95 transition-transform duration-100',

    /**
     * Mobile-optimized transforms
     */
    mobileTransform: 'will-change-transform',
  },
} as const;

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Responsive breakpoint configuration
 */
export interface BreakpointConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

/**
 * Device type classification
 */
export interface DeviceClassification {
  type: DeviceType;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  touchCapable: boolean;
}

/**
 * Responsive content configuration
 */
export interface ResponsiveConfig {
  deviceType: DeviceType;
  optimalColumns: number;
  spacing: {
    component: string;
    section: string;
    content: string;
  };
  typography: {
    display: string;
    title: string;
    heading: string;
    body: string;
    caption: string;
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create responsive CSS custom properties for dynamic theming
 */
export function createResponsiveCSSVariables(): Record<string, string> {
  return {
    // Breakpoint-based spacing
    '--responsive-spacing-xs': '0.25rem',
    '--responsive-spacing-sm': '0.5rem',
    '--responsive-spacing-md': '1rem',
    '--responsive-spacing-lg': '1.5rem',
    '--responsive-spacing-xl': '2rem',

    // Typography scale variables
    '--text-display-responsive': 'clamp(1.5rem, 4vw, 2.5rem)',
    '--text-title-responsive': 'clamp(1.25rem, 3vw, 1.875rem)',
    '--text-heading-responsive': 'clamp(1.125rem, 2.5vw, 1.5rem)',
    '--text-body-responsive': 'clamp(0.875rem, 2vw, 1rem)',

    // Container widths
    '--container-xs': '100%',
    '--container-sm': '100%',
    '--container-md': '100%',
    '--container-lg': '1024px',
    '--container-xl': '1280px',
    '--container-2xl': '1536px',
  };
}

/**
 * Generate responsive utility classes for a specific breakpoint
 */
export function generateBreakpointClasses(breakpoint: BreakpointKey): string[] {
  const classes = [];

  // Container classes
  classes.push(`container-${breakpoint}:max-w-7xl`);
  classes.push(`container-${breakpoint}:mx-auto`);
  classes.push(`container-${breakpoint}:px-4`);

  // Grid classes
  classes.push(`grid-${breakpoint}:grid-cols-1`);
  if (breakpoint === 'sm') classes.push(`grid-${breakpoint}:grid-cols-2`);
  if (breakpoint === 'lg') classes.push(`grid-${breakpoint}:grid-cols-3`);
  if (breakpoint === 'xl') classes.push(`grid-${breakpoint}:grid-cols-4`);

  // Typography classes
  classes.push(`text-${breakpoint}:text-sm`);
  if (breakpoint === 'sm') classes.push(`text-${breakpoint}:text-base`);
  if (breakpoint === 'lg') classes.push(`text-${breakpoint}:text-lg`);

  return classes;
}

/**
 * Validate responsive breakpoint configuration
 */
export function validateBreakpoints(config: BreakpointConfig): boolean {
  const values = Object.values(config);

  // Check that breakpoints are in ascending order
  for (let i = 1; i < values.length; i++) {
    const current = parseInt(values[i]);
    const previous = parseInt(values[i - 1]);

    if (current <= previous) {
      console.warn(
        `Breakpoint ${Object.keys(config)[i]} (${current}px) should be larger than ${Object.keys(config)[i - 1]} (${previous}px)`
      );
      return false;
    }
  }

  return true;
}

// ========================================
// HOOKS FOR RESPONSIVE BEHAVIOR
// ========================================

/**
 * React hook for responsive behavior (to be implemented in components)
 */
export function useResponsive(): ResponsiveConfig {
  // This would be implemented with useState and useEffect
  // to track window resize and provide responsive configuration
  return {
    deviceType: 'desktop',
    optimalColumns: 3,
    spacing: responsiveClasses.spacing,
    typography: responsiveClasses.textResponsive,
  };
}

/**
 * Hook for device classification
 */
export function useDeviceClassification(): DeviceClassification {
  // This would be implemented to detect device characteristics
  return {
    type: 'desktop',
    width: 1920,
    height: 1080,
    orientation: 'landscape',
    pixelRatio: 2,
    touchCapable: false,
  };
}

// ========================================
// EXPORT UTILITIES
// ========================================

/**
 * Default export for easy importing
 */
export default {
  BREAKPOINTS,
  BREAKPOINT_VALUES,
  BREAKPOINT_RANGES,
  responsiveClasses,
  getDeviceType,
  getOptimalColumnCount,
  getOptimalSpacing,
  createResponsiveCSSVariables,
  validateBreakpoints,
  useResponsive,
  useDeviceClassification,
};
