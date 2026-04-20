/**
 * SmartSlate Premium Design System
 * Comprehensive export of all design tokens and utilities
 */

export * from './glass-morphism';
export * from './animations';
export * from './typography';
export * from './spacing';

// Re-export commonly used items for convenience
export {
  springPresets,
  orchestratedEntrance,
  sectionTransitions,
  itemAnimations,
  microInteractions,
} from './animations';
export { glassCard, glassPanel } from './glass-morphism';
export { typographyPresets, magazineLayouts } from './typography';
export { spacingUtilities, containerWidths, spacing } from './spacing';

// Additional design tokens
export const colors = {
  // Premium color palette with subtle variations
  primary: {
    DEFAULT: 'rgb(167, 218, 219)', // #a7dada
    light: 'rgb(187, 238, 239)',
    dark: 'rgb(127, 178, 179)',
    muted: 'rgba(167, 218, 219, 0.1)',
    contrast: 'rgb(17, 24, 39)',
  },

  secondary: {
    DEFAULT: 'rgb(230, 184, 156)', // #e6b89c
    light: 'rgb(250, 204, 176)',
    dark: 'rgb(190, 144, 116)',
    muted: 'rgba(230, 184, 156, 0.1)',
    contrast: 'rgb(17, 24, 39)',
  },

  accent: {
    violet: 'rgb(167, 139, 250)',
    indigo: 'rgb(129, 140, 248)',
    blue: 'rgb(96, 165, 250)',
    cyan: 'rgb(103, 232, 249)',
    emerald: 'rgb(52, 211, 153)',
    amber: 'rgb(251, 191, 36)',
    rose: 'rgb(251, 113, 133)',
  },

  neutral: {
    50: 'rgb(249, 250, 251)',
    100: 'rgb(243, 244, 246)',
    200: 'rgb(229, 231, 235)',
    300: 'rgb(209, 213, 219)',
    400: 'rgb(156, 163, 175)',
    500: 'rgb(107, 114, 128)',
    600: 'rgb(75, 85, 99)',
    700: 'rgb(55, 65, 81)',
    800: 'rgb(31, 41, 55)',
    900: 'rgb(17, 24, 39)',
    950: 'rgb(3, 7, 18)',
  },
} as const;

// Elevation system
export const elevation = {
  none: '',
  xs: 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
  sm: 'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
  md: 'shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)]',
  lg: 'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.06)]',
  xl: 'shadow-[0_16px_48px_rgba(0,0,0,0.16),0_8px_16px_rgba(0,0,0,0.08)]',
  '2xl': 'shadow-[0_24px_64px_rgba(0,0,0,0.20),0_12px_24px_rgba(0,0,0,0.10)]',

  // Colored shadows
  primary: 'shadow-[0_8px_32px_rgba(167,218,219,0.25)]',
  secondary: 'shadow-[0_8px_32px_rgba(230,184,156,0.25)]',

  // Inner shadows
  inner: {
    sm: 'shadow-inner shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]',
    md: 'shadow-inner shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]',
    lg: 'shadow-inner shadow-[inset_0_4px_8px_rgba(0,0,0,0.12)]',
  },
} as const;

// Border radius system
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm', // 2px
  DEFAULT: 'rounded', // 4px
  md: 'rounded-md', // 6px
  lg: 'rounded-lg', // 8px
  xl: 'rounded-xl', // 12px
  '2xl': 'rounded-2xl', // 16px
  '3xl': 'rounded-3xl', // 24px
  full: 'rounded-full',

  // Special shapes
  pill: 'rounded-full',
  card: 'rounded-2xl',
  modal: 'rounded-3xl',
} as const;

// Z-index system
export const zIndex = {
  auto: 'z-auto',
  0: 'z-0',
  10: 'z-10', // Base content
  20: 'z-20', // Floating elements
  30: 'z-30', // Dropdowns
  40: 'z-40', // Fixed headers
  50: 'z-50', // Modals
  60: 'z-60', // Popovers
  70: 'z-70', // Tooltips
  80: 'z-80', // Notifications
  90: 'z-90', // Command palette
  100: 'z-[100]', // Critical UI
  max: 'z-[9999]', // Maximum
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// Utility function to combine classes conditionally
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Composite component styles
export const componentStyles = {
  // Premium button styles
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',

    variants: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-md hover:shadow-lg',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary-dark shadow-md hover:shadow-lg',
      ghost: 'text-foreground hover:bg-foreground/5 hover:text-foreground',
      outline: 'border border-neutral-300 text-foreground hover:bg-foreground/5',
      glass:
        'bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white hover:bg-white/[0.12]',
    },

    sizes: {
      xs: 'h-7 px-3 text-xs rounded-md gap-1',
      sm: 'h-9 px-4 text-sm rounded-lg gap-1.5',
      md: 'h-11 px-6 text-base rounded-xl gap-2',
      lg: 'h-14 px-8 text-lg rounded-2xl gap-2.5',
      xl: 'h-16 px-10 text-xl rounded-3xl gap-3',
    },
  },

  // Card styles
  card: {
    base: 'rounded-2xl overflow-hidden transition-all duration-300',
    interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',

    variants: {
      flat: 'bg-surface border border-neutral-200',
      elevated: 'bg-surface shadow-md hover:shadow-lg',
      glass: 'bg-white/[0.06] backdrop-blur-lg border border-white/[0.1]',
      gradient:
        'bg-gradient-to-br from-primary/[0.08] to-secondary/[0.08] border border-white/[0.1]',
    },
  },

  // Input styles
  input: {
    base: 'w-full transition-all duration-200 focus:outline-none',

    variants: {
      default:
        'bg-background border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
      glass:
        'bg-white/[0.06] backdrop-blur-md border border-white/[0.1] focus:border-primary/50 focus:bg-white/[0.08]',
      filled:
        'bg-neutral-100 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20',
    },

    sizes: {
      sm: 'h-9 px-3 text-sm rounded-lg',
      md: 'h-11 px-4 text-base rounded-xl',
      lg: 'h-14 px-5 text-lg rounded-2xl',
    },
  },
} as const;
