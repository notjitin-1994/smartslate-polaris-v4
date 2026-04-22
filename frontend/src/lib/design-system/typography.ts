/**
 * Premium Typography System
 * Fluid scaling with magazine-style layouts
 */

// Typography scale with fluid sizing
export const typographyScale = {
  // Display sizes for hero sections
  display: {
    xs: 'text-[clamp(2rem,4vw,2.5rem)]',
    sm: 'text-[clamp(2.5rem,5vw,3rem)]',
    md: 'text-[clamp(3rem,6vw,4rem)]',
    lg: 'text-[clamp(4rem,8vw,5rem)]',
    xl: 'text-[clamp(5rem,10vw,6rem)]',
  },

  // Heading sizes
  heading: {
    h1: 'text-[clamp(2rem,4vw,2.75rem)]',
    h2: 'text-[clamp(1.75rem,3.5vw,2.25rem)]',
    h3: 'text-[clamp(1.5rem,3vw,1.875rem)]',
    h4: 'text-[clamp(1.25rem,2.5vw,1.5rem)]',
    h5: 'text-[clamp(1.125rem,2vw,1.25rem)]',
    h6: 'text-[clamp(1rem,1.5vw,1.125rem)]',
  },

  // Body text sizes
  body: {
    xs: 'text-[clamp(0.75rem,1.5vw,0.875rem)]',
    sm: 'text-[clamp(0.875rem,1.75vw,1rem)]',
    base: 'text-[clamp(1rem,2vw,1.125rem)]',
    lg: 'text-[clamp(1.125rem,2.25vw,1.25rem)]',
    xl: 'text-[clamp(1.25rem,2.5vw,1.5rem)]',
  },

  // Special sizes
  caption: 'text-[clamp(0.625rem,1.25vw,0.75rem)]',
  overline: 'text-[clamp(0.75rem,1.5vw,0.875rem)]',
  quote: 'text-[clamp(1.25rem,2.5vw,1.75rem)]',
} as const;

// Font families with fallbacks
export const fontFamilies = {
  // Premium serif for headings
  serif: {
    display: 'font-["Crimson_Pro","Playfair_Display","Georgia",serif]',
    heading: 'font-["Lora","Merriweather","Georgia",serif]',
    body: 'font-["Source_Serif_Pro","Georgia",serif]',
  },

  // Modern sans-serif for body
  sans: {
    display: 'font-["Inter_Tight","Inter","system-ui",sans-serif]',
    heading: 'font-["Inter","system-ui",sans-serif]',
    body: 'font-["Inter","system-ui",sans-serif]',
    ui: 'font-["Inter","system-ui",sans-serif]',
  },

  // Monospace for code
  mono: 'font-["JetBrains_Mono","SF_Mono","Consolas",monospace]',
} as const;

// Font weights
export const fontWeights = {
  thin: 'font-thin', // 100
  extralight: 'font-extralight', // 200
  light: 'font-light', // 300
  normal: 'font-normal', // 400
  medium: 'font-medium', // 500
  semibold: 'font-semibold', // 600
  bold: 'font-bold', // 700
  extrabold: 'font-extrabold', // 800
  black: 'font-black', // 900
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: 'tracking-tighter', // -0.05em
  tight: 'tracking-tight', // -0.025em
  normal: 'tracking-normal', // 0
  wide: 'tracking-wide', // 0.025em
  wider: 'tracking-wider', // 0.05em
  widest: 'tracking-widest', // 0.1em
} as const;

// Line heights - Updated for better readability
export const lineHeights = {
  none: 'leading-none', // 1
  tight: 'leading-tight', // 1.25
  snug: 'leading-[1.5]', // 1.5 for headers
  normal: 'leading-normal', // 1.5
  relaxed: 'leading-[1.75]', // 1.75 for body text
  loose: 'leading-loose', // 2
} as const;

// Typography presets for different content types
export const typographyPresets = {
  // Hero sections
  heroTitle: `${typographyScale.display.lg} ${fontFamilies.serif.display} ${fontWeights.bold} ${letterSpacing.tight} ${lineHeights.tight}`,
  heroSubtitle: `${typographyScale.heading.h2} ${fontFamilies.sans.heading} ${fontWeights.light} ${letterSpacing.normal} ${lineHeights.snug}`,

  // Article/Blog style
  articleTitle: `${typographyScale.heading.h1} ${fontFamilies.serif.heading} ${fontWeights.bold} ${letterSpacing.tight} ${lineHeights.tight}`,
  articleBody: `${typographyScale.body.base} ${fontFamilies.sans.body} ${fontWeights.normal} ${letterSpacing.normal} ${lineHeights.relaxed}`,
  articleLead: `${typographyScale.body.lg} ${fontFamilies.sans.body} ${fontWeights.normal} ${letterSpacing.normal} ${lineHeights.relaxed} text-text-secondary`,

  // UI elements
  buttonText: `${typographyScale.body.sm} ${fontFamilies.sans.ui} ${fontWeights.medium} ${letterSpacing.wide}`,
  labelText: `${typographyScale.body.xs} ${fontFamilies.sans.ui} ${fontWeights.medium} ${letterSpacing.wider} uppercase`,
  captionText: `${typographyScale.caption} ${fontFamilies.sans.ui} ${fontWeights.normal} ${letterSpacing.normal}`,

  // Data display
  dataValue: `${typographyScale.heading.h3} ${fontFamilies.sans.display} ${fontWeights.bold} ${letterSpacing.tight}`,
  dataLabel: `${typographyScale.body.sm} ${fontFamilies.sans.ui} ${fontWeights.medium} ${letterSpacing.wide} text-text-secondary`,

  // Quotes and testimonials
  blockquote: `${typographyScale.quote} ${fontFamilies.serif.body} ${fontWeights.light} ${letterSpacing.normal} ${lineHeights.relaxed} italic`,
  attribution: `${typographyScale.body.sm} ${fontFamilies.sans.body} ${fontWeights.medium} ${letterSpacing.wide}`,
} as const;

// Text decoration classes
export const textDecoration = {
  // Underlines
  underline: 'underline',
  underlineHover: 'hover:underline',
  underlineOffset: 'underline underline-offset-4',
  underlineThick: 'underline decoration-2',
  underlineWavy: 'underline decoration-wavy',

  // Other decorations
  lineThrough: 'line-through',
  noUnderline: 'no-underline',

  // Gradients
  gradientPrimary: 'bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent',
  gradientSecondary:
    'bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent',
  gradientRainbow:
    'bg-gradient-to-r from-red-500 via-primary to-secondary bg-clip-text text-transparent',
} as const;

// Text shadows for depth
export const textShadows = {
  none: '',
  sm: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
  md: 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]',
  lg: 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]',
  glow: 'drop-shadow-[0_0_20px_rgba(167,218,219,0.5)]',
} as const;

// Utility function to create responsive typography
export function createResponsiveTypography(options: {
  mobile: string;
  tablet?: string;
  desktop: string;
}) {
  const { mobile, tablet, desktop } = options;
  const tabletClass = tablet || desktop;

  return `${mobile} md:${tabletClass} lg:${desktop}`;
}

// Magazine-style layout utilities
export const magazineLayouts = {
  // Drop caps
  dropCap:
    'first-letter:text-7xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-serif',

  // Multi-column layouts
  columns: {
    two: 'columns-2 gap-8',
    three: 'columns-3 gap-8',
    four: 'columns-4 gap-8',
  },

  // Pull quotes
  pullQuote: 'text-2xl font-serif italic text-center py-8 px-12 border-l-4 border-primary my-8',

  // Text wrapping
  wrapShape: {
    circle: 'shape-outside-circle',
    ellipse: 'shape-outside-ellipse',
    polygon: 'shape-outside-polygon',
  },
} as const;
