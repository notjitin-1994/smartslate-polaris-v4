/**
 * Touch-First Component System - Touch Target Constants and Configuration
 *
 * This module defines the comprehensive touch target system for SmartSlate Polaris v3,
 * ensuring all interactive elements meet accessibility standards and provide optimal
 * touch experiences across all devices and screen sizes.
 */

// ========================================
// TOUCH TARGET SIZE CONSTANTS
// ========================================

/**
 * Standard touch target sizes following WCAG 2.1 AA guidelines
 * and modern mobile interaction design best practices
 */
export const TOUCH_TARGETS = {
  /**
   * Minimum recommended touch target size (44px)
   * Meets WCAG 2.1 AA accessibility requirements
   */
  minimum: 'min-h-[44px] min-w-[44px]',

  /**
   * Small touch target for compact layouts (36px)
   * Used when space is limited but accessibility is maintained
   */
  small: 'min-h-[36px] min-w-[36px]',

  /**
   * Large touch target for primary actions (48px)
   * Provides extra comfort for critical interactions
   */
  large: 'min-h-[48px] min-w-[48px]',

  /**
   * Extra large touch target for hero elements (56px)
   * Used for primary CTAs and important navigation
   */
  'extra-large': 'min-h-[56px] min-w-[56px]',
} as const;

/**
 * Type-safe touch target size keys
 */
export type TouchTargetSize = keyof typeof TOUCH_TARGETS;

/**
 * Touch target size values in pixels for calculations
 */
export const TOUCH_TARGET_VALUES = {
  minimum: 44,
  small: 36,
  large: 48,
  'extra-large': 56,
} as const;

// ========================================
// SPACING CONSTANTS FOR TOUCH INTERFACES
// ========================================

/**
 * Minimum spacing between interactive elements
 * Ensures touch targets don't interfere with each other
 */
export const TOUCH_SPACING = {
  /**
   * Minimum gap between touch targets (8px)
   * Prevents accidental taps on adjacent elements
   */
  minimum: 'gap-2', // 8px

  /**
   * Standard spacing between related elements (12px)
   * Comfortable spacing for grouped controls
   */
  standard: 'gap-3', // 12px

  /**
   * Comfortable spacing for form elements (16px)
   * Optimal for touch form interactions
   */
  comfortable: 'gap-4', // 16px

  /**
   * Generous spacing for complex layouts (24px)
   * Used when elements need clear visual separation
   */
  generous: 'gap-6', // 24px
} as const;

/**
 * Type-safe spacing keys
 */
export type TouchSpacing = keyof typeof TOUCH_SPACING;

/**
 * Spacing values in pixels for calculations
 */
export const TOUCH_SPACING_VALUES = {
  minimum: 8,
  standard: 12,
  comfortable: 16,
  generous: 24,
} as const;

// ========================================
// TOUCH TARGET UTILITY FUNCTIONS
// ========================================

/**
 * Calculate the effective touch area for an element
 * Considers both the visual element and any extended touch areas
 */
export function calculateEffectiveTouchArea(
  visualWidth: number,
  visualHeight: number,
  extendedPadding = 0
): { width: number; height: number } {
  return {
    width: Math.max(visualWidth + extendedPadding * 2, TOUCH_TARGET_VALUES.minimum),
    height: Math.max(visualHeight + extendedPadding * 2, TOUCH_TARGET_VALUES.minimum),
  };
}

/**
 * Validate that a touch target meets minimum size requirements
 */
export function validateTouchTarget(
  width: number,
  height: number,
  requiredSize: TouchTargetSize = 'minimum'
): { isValid: boolean; actualSize: number; requiredSize: number } {
  const requiredValue = TOUCH_TARGET_VALUES[requiredSize];
  const minDimension = Math.min(width, height);

  return {
    isValid: minDimension >= requiredValue,
    actualSize: minDimension,
    requiredSize: requiredValue,
  };
}

/**
 * Get optimal touch target size based on element importance and available space
 */
export function getOptimalTouchTarget(
  elementType: 'primary' | 'secondary' | 'tertiary',
  availableSpace: { width: number; height: number }
): TouchTargetSize {
  const { width: availableWidth, height: availableHeight } = availableSpace;
  const availableMin = Math.min(availableWidth, availableHeight);

  // If space is very limited, use small but ensure minimum requirements
  if (availableMin < TOUCH_TARGET_VALUES.large) {
    return availableMin >= TOUCH_TARGET_VALUES.minimum ? 'minimum' : 'small';
  }

  // For primary actions, prefer larger targets when space allows
  if (elementType === 'primary') {
    if (availableMin >= TOUCH_TARGET_VALUES['extra-large'] + 20) return 'extra-large'; // Need extra space for extra-large
    if (availableMin >= TOUCH_TARGET_VALUES.large) return 'large';
    if (availableMin >= TOUCH_TARGET_VALUES.minimum) return 'minimum';
    return 'small';
  }

  // For secondary actions, use appropriate size based on space
  if (elementType === 'secondary') {
    if (availableMin >= TOUCH_TARGET_VALUES.large) return 'large';
    return 'minimum';
  }

  // For tertiary actions, use minimum size
  return 'minimum';
}

/**
 * Calculate minimum padding needed to achieve target touch size
 */
export function calculateTouchPadding(
  visualWidth: number,
  visualHeight: number,
  targetSize: TouchTargetSize = 'minimum'
): { horizontal: number; vertical: number } {
  const targetValue = TOUCH_TARGET_VALUES[targetSize];

  if (visualWidth >= targetValue && visualHeight >= targetValue) {
    return { horizontal: 0, vertical: 0 };
  }

  const horizontalPadding =
    visualWidth < targetValue ? Math.ceil((targetValue - visualWidth) / 2) : 0;
  const verticalPadding =
    visualHeight < targetValue ? Math.ceil((targetValue - visualHeight) / 2) : 0;

  return {
    horizontal: horizontalPadding,
    vertical: verticalPadding,
  };
}

// ========================================
// TOUCH STATE CONSTANTS
// ========================================

/**
 * Touch interaction states for consistent behavior
 */
export const TOUCH_STATES = {
  /**
   * Default state - element is ready for interaction
   */
  default: '',

  /**
   * Hover state - mouse pointer is over element (desktop)
   */
  hover: 'hover:scale-[1.02] hover:shadow-lg',

  /**
   * Focus state - element has keyboard focus
   */
  focus: 'focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2',

  /**
   * Active state - element is being pressed/tapped
   */
  active: 'active:scale-[0.98] active:shadow-sm',

  /**
   * Disabled state - element is not interactive
   */
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
} as const;

/**
 * Type-safe touch state keys
 */
export type TouchState = keyof typeof TOUCH_STATES;

// ========================================
// RESPONSIVE TOUCH ADJUSTMENTS
// ========================================

/**
 * Get touch target adjustments based on screen size
 */
export function getResponsiveTouchAdjustments(screenWidth: number) {
  // On very small screens, slightly reduce touch targets to fit more content
  if (screenWidth < 375) {
    return {
      minimumReduction: 2, // Reduce minimum by 2px on very small screens
      smallReduction: 1,
      enableCompactMode: true,
    };
  }

  // On tablet screens, can use slightly larger targets for comfort
  if (screenWidth >= 768 && screenWidth < 1024) {
    return {
      minimumIncrease: 2, // Increase minimum by 2px on tablets
      smallIncrease: 1,
      enableComfortMode: true,
    };
  }

  return {
    minimumReduction: 0,
    smallReduction: 0,
    minimumIncrease: 0,
    smallIncrease: 0,
    enableCompactMode: false,
    enableComfortMode: false,
  };
}

/**
 * Calculate responsive touch target size based on screen characteristics
 */
export function getResponsiveTouchTarget(
  baseSize: TouchTargetSize,
  screenWidth: number
): TouchTargetSize {
  const adjustments = getResponsiveTouchAdjustments(screenWidth);

  // Apply responsive adjustments
  if (adjustments.enableCompactMode && screenWidth < 375) {
    if (baseSize === 'minimum') return 'small';
    if (baseSize === 'small') return 'small'; // Keep at small minimum
  }

  if (adjustments.enableComfortMode && screenWidth >= 768) {
    if (baseSize === 'minimum') return 'large';
    if (baseSize === 'small') return 'minimum';
  }

  return baseSize;
}

// ========================================
// TOUCH ACCESSIBILITY CONSTANTS
// ========================================

/**
 * Accessibility requirements for touch interfaces
 */
export const TOUCH_ACCESSIBILITY = {
  /**
   * Minimum color contrast ratio for touch targets (WCAG AA)
   */
  minContrastRatio: 4.5,

  /**
   * Enhanced contrast ratio for better visibility (recommended)
   */
  enhancedContrastRatio: 7.0,

  /**
   * Minimum focus indicator thickness
   */
  focusIndicatorThickness: '2px',

  /**
   * Focus indicator offset for better visibility
   */
  focusIndicatorOffset: '2px',

  /**
   * Touch target extension for small visual elements
   */
  touchTargetExtension: '4px',
} as const;

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Touch target configuration interface
 */
export interface TouchTargetConfig {
  size: TouchTargetSize;
  spacing: TouchSpacing;
  visualWidth?: number;
  visualHeight?: number;
  elementType: 'primary' | 'secondary' | 'tertiary';
  screenWidth?: number;
}

/**
 * Touch interaction configuration
 */
export interface TouchInteractionConfig {
  enableHapticFeedback: boolean;
  enableVisualFeedback: boolean;
  enableSoundFeedback: boolean;
  feedbackDuration: number;
}

/**
 * Responsive touch configuration
 */
export interface ResponsiveTouchConfig {
  baseSize: TouchTargetSize;
  responsiveSizes: Record<number, TouchTargetSize>; // screenWidth -> size mapping
  adaptiveSpacing: boolean;
}

// ========================================
// UTILITY FUNCTIONS FOR COMPONENTS
// ========================================

/**
 * Generate touch-optimized CSS classes for an element
 */
export function generateTouchClasses(config: TouchTargetConfig): string {
  const { size, spacing, elementType } = config;
  const touchTargetClass = TOUCH_TARGETS[size];
  const spacingClass = TOUCH_SPACING[spacing];

  // Add responsive adjustments if screen width is provided
  if (config.screenWidth) {
    const responsiveSize = getResponsiveTouchTarget(size, config.screenWidth);
    if (responsiveSize !== size) {
      return `${TOUCH_TARGETS[responsiveSize]} ${spacingClass}`;
    }
  }

  return `${touchTargetClass} ${spacingClass}`;
}

/**
 * Validate touch target compliance for an element
 */
export function validateTouchCompliance(
  element: HTMLElement,
  requiredSize: TouchTargetSize = 'minimum'
): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  const rect = element.getBoundingClientRect();
  const { width, height } = rect;

  const validation = validateTouchTarget(width, height, requiredSize);

  if (!validation.isValid) {
    issues.push(
      `Touch target size ${validation.actualSize}px is below required ${validation.requiredSize}px`
    );
  }

  // Check for sufficient spacing from other interactive elements
  const style = getComputedStyle(element);
  const margin = parseInt(style.margin) || 0;

  if (margin < TOUCH_SPACING_VALUES.minimum) {
    issues.push(`Element spacing ${margin}px is below minimum ${TOUCH_SPACING_VALUES.minimum}px`);
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Get recommended touch target size for an element type and context
 */
export function getRecommendedTouchSize(
  elementType: 'button' | 'input' | 'link' | 'checkbox' | 'radio',
  context: 'primary' | 'secondary' | 'navigation' | 'form' | 'toolbar',
  availableSpace?: { width: number; height: number }
): TouchTargetSize {
  const recommendations = {
    button: {
      primary: 'large' as TouchTargetSize,
      secondary: 'minimum' as TouchTargetSize,
      navigation: 'minimum' as TouchTargetSize,
      form: 'large' as TouchTargetSize,
      toolbar: 'minimum' as TouchTargetSize,
    },
    input: {
      primary: 'large' as TouchTargetSize,
      secondary: 'minimum' as TouchTargetSize,
      navigation: 'minimum' as TouchTargetSize,
      form: 'large' as TouchTargetSize,
      toolbar: 'minimum' as TouchTargetSize,
    },
    link: {
      primary: 'minimum' as TouchTargetSize,
      secondary: 'minimum' as TouchTargetSize,
      navigation: 'minimum' as TouchTargetSize,
      form: 'minimum' as TouchTargetSize,
      toolbar: 'minimum' as TouchTargetSize,
    },
    checkbox: {
      primary: 'large' as TouchTargetSize,
      secondary: 'minimum' as TouchTargetSize,
      navigation: 'minimum' as TouchTargetSize,
      form: 'minimum' as TouchTargetSize,
      toolbar: 'minimum' as TouchTargetSize,
    },
    radio: {
      primary: 'large' as TouchTargetSize,
      secondary: 'minimum' as TouchTargetSize,
      navigation: 'minimum' as TouchTargetSize,
      form: 'minimum' as TouchTargetSize,
      toolbar: 'minimum' as TouchTargetSize,
    },
  };

  const size = recommendations[elementType]?.[context] || 'minimum';

  // Adjust based on available space if provided
  if (availableSpace) {
    return getOptimalTouchTarget(context === 'primary' ? 'primary' : 'secondary', availableSpace);
  }

  return size;
}

// ========================================
// EXPORT UTILITIES
// ========================================

/**
 * Default export for easy importing
 */
export default {
  TOUCH_TARGETS,
  TOUCH_TARGET_VALUES,
  TOUCH_SPACING,
  TOUCH_SPACING_VALUES,
  TOUCH_STATES,
  TOUCH_ACCESSIBILITY,
  calculateEffectiveTouchArea,
  validateTouchTarget,
  getOptimalTouchTarget,
  calculateTouchPadding,
  getResponsiveTouchAdjustments,
  getResponsiveTouchTarget,
  generateTouchClasses,
  validateTouchCompliance,
  getRecommendedTouchSize,
};
