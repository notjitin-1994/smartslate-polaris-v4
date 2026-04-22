/**
 * Premium Glass Morphism Design System
 * Multi-layered glass effects with dynamic blur and opacity
 */

export const glassStyles = {
  // Base glass layers - Softer for cleaner aesthetic
  subtle: 'bg-white/[0.01] backdrop-blur-[4px] border border-white/[0.03]',
  light: 'bg-white/[0.02] backdrop-blur-[6px] border border-white/[0.05]',
  medium: 'bg-white/[0.03] backdrop-blur-[8px] border border-white/[0.08]',
  strong: 'bg-white/[0.04] backdrop-blur-[10px] border border-white/[0.1]',
  intense: 'bg-white/[0.05] backdrop-blur-[12px] border border-white/[0.12]',

  // Prismatic color shifts
  prism: {
    hover:
      'hover:bg-gradient-to-br hover:from-primary/[0.08] hover:via-secondary/[0.05] hover:to-primary/[0.08]',
    active: 'bg-gradient-to-br from-primary/[0.1] via-secondary/[0.06] to-primary/[0.1]',
    subtle: 'bg-gradient-to-br from-white/[0.04] via-primary/[0.02] to-white/[0.04]',
  },

  // Depth hierarchy shadows - Softer for cleaner aesthetic (max 20% opacity)
  shadow: {
    none: '',
    sm: 'shadow-[0_2px_8px_rgba(0,0,0,0.02)]',
    md: 'shadow-[0_4px_16px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.02)]',
    lg: 'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]',
    xl: 'shadow-[0_16px_48px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.06)]',
    glow: 'shadow-[0_0_40px_rgba(167,218,219,0.08),0_8px_32px_rgba(0,0,0,0.06)]',
  },

  // Ambient light effects
  ambient: {
    primary:
      'before:absolute before:inset-0 before:bg-gradient-radial before:from-primary/[0.08] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
    secondary:
      'before:absolute before:inset-0 before:bg-gradient-radial before:from-secondary/[0.08] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
    rainbow:
      'before:absolute before:inset-0 before:bg-gradient-conic before:from-primary/[0.1] before:via-secondary/[0.1] before:to-primary/[0.1] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700 before:blur-xl',
  },
} as const;

// Glass card presets
export const glassCard = {
  base: `${glassStyles.medium} ${glassStyles.shadow.md} rounded-2xl overflow-hidden relative transition-all duration-300`,
  hover: `hover:${glassStyles.strong} hover:${glassStyles.shadow.lg} ${glassStyles.prism.hover}`,
  interactive: `${glassStyles.medium} ${glassStyles.shadow.md} rounded-2xl overflow-hidden relative transition-all duration-300 hover:${glassStyles.strong} hover:${glassStyles.shadow.lg} ${glassStyles.prism.hover} hover:scale-[1.02] active:scale-[0.98]`,
  premium: `${glassStyles.strong} ${glassStyles.shadow.lg} ${glassStyles.prism.subtle} rounded-3xl overflow-hidden relative transition-all duration-500 hover:${glassStyles.shadow.xl}`,
} as const;

// Glass panel presets for larger surfaces
export const glassPanel = {
  sidebar: `${glassStyles.light} ${glassStyles.shadow.md} ${glassStyles.ambient.primary}`,
  header: `${glassStyles.subtle} ${glassStyles.shadow.sm} backdrop-saturate-150`,
  modal: `${glassStyles.strong} ${glassStyles.shadow.xl} ${glassStyles.prism.subtle}`,
  floating: `${glassStyles.intense} ${glassStyles.shadow.glow} ${glassStyles.ambient.rainbow}`,
} as const;

// Utility function to create custom glass effects
export function createGlassEffect(options: {
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  opacity?: number;
  border?: boolean;
  shadow?: keyof typeof glassStyles.shadow;
  prism?: boolean;
  ambient?: 'primary' | 'secondary' | 'rainbow';
}) {
  const {
    blur = 'lg',
    opacity = 0.06,
    border = true,
    shadow = 'md',
    prism = false,
    ambient = null,
  } = options;

  const classes = [
    `bg-white/[${opacity}]`,
    `backdrop-blur-${blur}`,
    border && `border border-white/[${Math.min(opacity * 2, 0.2)}]`,
    glassStyles.shadow[shadow],
    prism && glassStyles.prism.subtle,
    ambient && glassStyles.ambient[ambient],
  ]
    .filter(Boolean)
    .join(' ');

  return classes;
}
