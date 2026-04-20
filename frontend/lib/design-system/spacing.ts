/**
 * Sophisticated Spacing System
 * Visual rhythm with mathematical scales
 */

// Base spacing unit (4px)
const BASE_UNIT = 4;

// Spacing scale using golden ratio and mathematical progression
export const spacing = {
  // Micro spacing
  px: '1px',
  0.5: `${BASE_UNIT * 0.5}px`, // 2px
  1: `${BASE_UNIT}px`, // 4px
  1.5: `${BASE_UNIT * 1.5}px`, // 6px

  // Regular scale
  2: `${BASE_UNIT * 2}px`, // 8px
  3: `${BASE_UNIT * 3}px`, // 12px
  4: `${BASE_UNIT * 4}px`, // 16px
  5: `${BASE_UNIT * 5}px`, // 20px
  6: `${BASE_UNIT * 6}px`, // 24px
  8: `${BASE_UNIT * 8}px`, // 32px
  10: `${BASE_UNIT * 10}px`, // 40px
  12: `${BASE_UNIT * 12}px`, // 48px
  16: `${BASE_UNIT * 16}px`, // 64px
  20: `${BASE_UNIT * 20}px`, // 80px
  24: `${BASE_UNIT * 24}px`, // 96px
  32: `${BASE_UNIT * 32}px`, // 128px
  40: `${BASE_UNIT * 40}px`, // 160px
  48: `${BASE_UNIT * 48}px`, // 192px
  56: `${BASE_UNIT * 56}px`, // 224px
  64: `${BASE_UNIT * 64}px`, // 256px
} as const;

// Semantic spacing tokens
export const spacingTokens = {
  // Component spacing
  component: {
    xs: spacing[2], // 8px
    sm: spacing[3], // 12px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
  },

  // Section spacing
  section: {
    xs: spacing[8], // 32px
    sm: spacing[12], // 48px
    md: spacing[16], // 64px
    lg: spacing[24], // 96px
    xl: spacing[32], // 128px
  },

  // Content spacing
  content: {
    xs: spacing[1], // 4px
    sm: spacing[2], // 8px
    md: spacing[3], // 12px
    lg: spacing[4], // 16px
    xl: spacing[6], // 24px
  },

  // Layout spacing
  layout: {
    gutter: spacing[6], // 24px
    margin: spacing[8], // 32px
    padding: spacing[6], // 24px
    containerX: spacing[6], // 24px horizontal
    containerY: spacing[8], // 32px vertical
  },
} as const;

// Spacing utilities for Tailwind classes - Updated for cleaner layouts
export const spacingUtilities = {
  // Padding utilities - Increased for more breathing room
  padding: {
    tight: 'p-4 sm:p-6 md:p-8', // Compact mode
    normal: 'p-6 sm:p-8 md:p-12', // Comfortable mode
    relaxed: 'p-8 sm:p-12 md:p-16', // Spacious mode
    loose: 'p-10 sm:p-14 md:p-20',
  },

  // Margin utilities
  margin: {
    tight: 'space-y-2 sm:space-y-3 md:space-y-4',
    normal: 'space-y-4 sm:space-y-6 md:space-y-8',
    relaxed: 'space-y-6 sm:space-y-8 md:space-y-12',
    loose: 'space-y-8 sm:space-y-12 md:space-y-16',
  },

  // Gap utilities for flex/grid
  gap: {
    tight: 'gap-2 sm:gap-3 md:gap-4',
    normal: 'gap-4 sm:gap-6 md:gap-8',
    relaxed: 'gap-6 sm:gap-8 md:gap-12',
    loose: 'gap-8 sm:gap-12 md:gap-16',
  },
} as const;

// Container width constraints
export const containerWidths = {
  xs: 'max-w-xs', // 320px
  sm: 'max-w-sm', // 384px
  md: 'max-w-md', // 448px
  lg: 'max-w-lg', // 512px
  xl: 'max-w-xl', // 576px
  '2xl': 'max-w-2xl', // 672px
  '3xl': 'max-w-3xl', // 768px
  '4xl': 'max-w-4xl', // 896px
  '5xl': 'max-w-5xl', // 1024px
  '6xl': 'max-w-6xl', // 1152px
  '7xl': 'max-w-7xl', // 1280px
  prose: 'max-w-prose', // 65ch
  screen: 'max-w-screen-2xl',
} as const;

// Grid systems
export const gridSystems = {
  // Standard grids
  twoColumn: 'grid grid-cols-1 md:grid-cols-2',
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  fourColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',

  // Asymmetric grids
  sidebar: 'grid grid-cols-1 lg:grid-cols-[300px_1fr]',
  sidebarRight: 'grid grid-cols-1 lg:grid-cols-[1fr_300px]',
  twoThirds: 'grid grid-cols-1 lg:grid-cols-[2fr_1fr]',

  // Magazine layouts
  feature: 'grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]',
  masonry: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
} as const;

// Responsive spacing utilities
export function createResponsiveSpacing(options: {
  mobile: number;
  tablet?: number;
  desktop: number;
}) {
  const { mobile, tablet, desktop } = options;
  const tabletValue = tablet || desktop;

  return {
    padding: `p-${mobile} md:p-${tabletValue} lg:p-${desktop}`,
    margin: `m-${mobile} md:m-${tabletValue} lg:m-${desktop}`,
    gap: `gap-${mobile} md:gap-${tabletValue} lg:gap-${desktop}`,
  };
}

// Aspect ratios for media containers
export const aspectRatios = {
  square: 'aspect-square', // 1:1
  video: 'aspect-video', // 16:9
  photo: 'aspect-[4/3]', // 4:3
  ultrawide: 'aspect-[21/9]', // 21:9
  portrait: 'aspect-[3/4]', // 3:4
  golden: 'aspect-[1.618/1]', // Golden ratio
} as const;
