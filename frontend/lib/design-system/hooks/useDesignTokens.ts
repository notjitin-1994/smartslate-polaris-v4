import { useEffect } from 'react';
import tokens from '../tokens';

/**
 * Hook to access and apply design tokens
 */
export function useDesignTokens() {
  // Apply CSS custom properties on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Apply color tokens
    Object.entries(tokens.colors).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--color-${category}-${key}`, value as string);
        });
      } else {
        root.style.setProperty(`--color-${category}`, values);
      }
    });

    // Apply spacing tokens
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply typography tokens
    Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString());
    });

    // Apply border radius tokens
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Apply elevation tokens
    Object.entries(tokens.elevation).forEach(([key, value]) => {
      root.style.setProperty(`--elevation-${key}`, value);
    });

    // Apply z-index tokens
    Object.entries(tokens.zIndex).forEach(([key, value]) => {
      root.style.setProperty(`--z-${key}`, value.toString());
    });

    // Apply touch target sizes
    Object.entries(tokens.touchTargets).forEach(([key, value]) => {
      root.style.setProperty(`--touch-${key}`, value);
    });
  }, []);

  return tokens;
}

/**
 * Helper to generate consistent class names based on design tokens
 */
export function getTokenClasses(category: keyof typeof tokens, value: string): string {
  return `token-${category}-${value}`;
}

/**
 * Helper to create responsive styles based on breakpoints
 */
export function createResponsiveStyles<T>(
  styles: Partial<Record<keyof typeof tokens.breakpoints, T>>
): T | Record<string, T> {
  const result: Record<string, T> = {};

  Object.entries(styles).forEach(([breakpoint, style]) => {
    if (breakpoint === 'mobile') {
      // Mobile styles apply as base
      Object.assign(result, style);
    } else {
      // Other breakpoints use media queries
      const mediaQuery = `@media (min-width: ${tokens.breakpoints[breakpoint as keyof typeof tokens.breakpoints]})`;
      result[mediaQuery] = style as T;
    }
  });

  return result;
}

/**
 * Helper to get color with opacity
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  // If it's already an HSL color, parse and adjust
  if (color.startsWith('hsl')) {
    return color.replace(')', `, ${opacity})`).replace('hsl(', 'hsla(');
  }

  // If it's hex, convert to rgba
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // If it's already rgba/rgb, adjust opacity
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`);
  }

  if (color.startsWith('rgb')) {
    return color.replace(')', `, ${opacity})`).replace('rgb(', 'rgba(');
  }

  return color;
}
