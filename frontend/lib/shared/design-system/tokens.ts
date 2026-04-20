/**
 * Design System Tokens
 * Centralized design tokens for the Polaris application
 */

export const colors = {
  // Primary palette - based on existing cyan/teal theme
  primary: {
    50: 'hsl(180, 60%, 95%)',
    100: 'hsl(180, 60%, 90%)',
    200: 'hsl(180, 60%, 80%)',
    300: 'hsl(180, 60%, 70%)',
    400: 'hsl(180, 60%, 60%)',
    500: 'hsl(180, 60%, 50%)', // Main primary
    600: 'hsl(180, 60%, 40%)',
    700: 'hsl(180, 60%, 30%)',
    800: 'hsl(180, 60%, 20%)',
    900: 'hsl(180, 60%, 10%)',
  },

  // Neutral palette
  neutral: {
    50: 'hsl(220, 10%, 98%)',
    100: 'hsl(220, 10%, 95%)',
    200: 'hsl(220, 10%, 85%)',
    300: 'hsl(220, 10%, 70%)',
    400: 'hsl(220, 10%, 55%)',
    500: 'hsl(220, 10%, 40%)',
    600: 'hsl(220, 10%, 30%)',
    700: 'hsl(220, 10%, 20%)',
    800: 'hsl(220, 10%, 10%)',
    900: 'hsl(220, 10%, 5%)',
  },

  // Semantic colors
  semantic: {
    error: 'hsl(0, 70%, 50%)',
    errorLight: 'hsl(0, 70%, 95%)',
    errorDark: 'hsl(0, 70%, 35%)',

    success: 'hsl(120, 60%, 40%)',
    successLight: 'hsl(120, 60%, 95%)',
    successDark: 'hsl(120, 60%, 30%)',

    warning: 'hsl(45, 100%, 50%)',
    warningLight: 'hsl(45, 100%, 95%)',
    warningDark: 'hsl(45, 100%, 35%)',

    info: 'hsl(200, 70%, 50%)',
    infoLight: 'hsl(200, 70%, 95%)',
    infoDark: 'hsl(200, 70%, 35%)',
  },

  // Background colors
  background: {
    primary: '#020C1B', // Dark blue background
    secondary: '#0a1628',
    tertiary: '#112240',
    elevated: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors with WCAG AA compliance
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    inverse: '#020C1B',
  },
} as const;

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'JetBrains Mono, Consolas, "Courier New", monospace',
    heading: 'Inter, system-ui, sans-serif',
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
} as const;

export const elevation = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  md: '0 4px 6px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.12)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  xl: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',

  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
} as const;

export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
} as const;

// Touch target sizes for accessibility
export const touchTargets = {
  sm: '36px',
  md: '44px', // Recommended minimum
  lg: '48px', // Google Material guideline
} as const;

// Glass morphism effects
export const glassMorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
} as const;

// Export type for TypeScript
export type DesignTokens = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  elevation: typeof elevation;
  borderRadius: typeof borderRadius;
  transitions: typeof transitions;
  breakpoints: typeof breakpoints;
  zIndex: typeof zIndex;
  touchTargets: typeof touchTargets;
  glassMorphism: typeof glassMorphism;
};

// Default export for easy access
const tokens: DesignTokens = {
  colors,
  spacing,
  typography,
  elevation,
  borderRadius,
  transitions,
  breakpoints,
  zIndex,
  touchTargets,
  glassMorphism,
};

export default tokens;
