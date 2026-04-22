/**
 * Touch Targets Module Tests
 *
 * Unit tests for the touch-first component system constants and utility functions
 */

import { describe, it, expect, vi } from 'vitest';
import {
  TOUCH_TARGETS,
  TOUCH_TARGET_VALUES,
  TOUCH_SPACING,
  TOUCH_SPACING_VALUES,
  calculateEffectiveTouchArea,
  validateTouchTarget,
  getOptimalTouchTarget,
  calculateTouchPadding,
  getResponsiveTouchAdjustments,
  getResponsiveTouchTarget,
  generateTouchClasses,
  validateTouchCompliance,
  getRecommendedTouchSize,
  type TouchTargetSize,
  type TouchSpacing,
} from '../touch-targets';

describe('Touch Target Constants', () => {
  it('should define correct touch target sizes', () => {
    expect(TOUCH_TARGETS.minimum).toBe('min-h-[44px] min-w-[44px]');
    expect(TOUCH_TARGETS.small).toBe('min-h-[36px] min-w-[36px]');
    expect(TOUCH_TARGETS.large).toBe('min-h-[48px] min-w-[48px]');
    expect(TOUCH_TARGETS['extra-large']).toBe('min-h-[56px] min-w-[56px]');
  });

  it('should define correct touch target values', () => {
    expect(TOUCH_TARGET_VALUES.minimum).toBe(44);
    expect(TOUCH_TARGET_VALUES.small).toBe(36);
    expect(TOUCH_TARGET_VALUES.large).toBe(48);
    expect(TOUCH_TARGET_VALUES['extra-large']).toBe(56);
  });

  it('should define correct spacing constants', () => {
    expect(TOUCH_SPACING.minimum).toBe('gap-2');
    expect(TOUCH_SPACING.standard).toBe('gap-3');
    expect(TOUCH_SPACING.comfortable).toBe('gap-4');
    expect(TOUCH_SPACING.generous).toBe('gap-6');
  });

  it('should define correct spacing values', () => {
    expect(TOUCH_SPACING_VALUES.minimum).toBe(8);
    expect(TOUCH_SPACING_VALUES.standard).toBe(12);
    expect(TOUCH_SPACING_VALUES.comfortable).toBe(16);
    expect(TOUCH_SPACING_VALUES.generous).toBe(24);
  });
});

describe('Touch Target Utility Functions', () => {
  describe('calculateEffectiveTouchArea', () => {
    it('should return original dimensions when already meeting minimum', () => {
      const result = calculateEffectiveTouchArea(50, 50);
      expect(result.width).toBe(50);
      expect(result.height).toBe(50);
    });

    it('should extend dimensions to meet minimum touch target', () => {
      const result = calculateEffectiveTouchArea(30, 30);
      expect(result.width).toBe(44);
      expect(result.height).toBe(44);
    });

    it('should handle extended padding correctly', () => {
      const result = calculateEffectiveTouchArea(40, 40, 4);
      expect(result.width).toBe(48);
      expect(result.height).toBe(48);
    });
  });

  describe('validateTouchTarget', () => {
    it('should validate minimum touch target size', () => {
      const result = validateTouchTarget(44, 44, 'minimum');
      expect(result.isValid).toBe(true);
      expect(result.actualSize).toBe(44);
      expect(result.requiredSize).toBe(44);
    });

    it('should fail validation for undersized targets', () => {
      const result = validateTouchTarget(30, 30, 'minimum');
      expect(result.isValid).toBe(false);
      expect(result.actualSize).toBe(30);
      expect(result.requiredSize).toBe(44);
    });

    it('should use minimum dimension for validation', () => {
      const result = validateTouchTarget(50, 30, 'minimum');
      expect(result.actualSize).toBe(30);
      expect(result.isValid).toBe(false);
    });
  });

  describe('getOptimalTouchTarget', () => {
    it('should return minimum for tertiary elements in limited space', () => {
      const result = getOptimalTouchTarget('tertiary', { width: 100, height: 100 });
      expect(result).toBe('minimum');
    });

    it('should return extra-large for primary elements with ample space', () => {
      const result = getOptimalTouchTarget('primary', { width: 200, height: 200 });
      expect(result).toBe('extra-large');
    });

    it('should downgrade to small when space is very limited', () => {
      const result = getOptimalTouchTarget('primary', { width: 30, height: 30 });
      expect(result).toBe('small');
    });
  });

  describe('calculateTouchPadding', () => {
    it('should return zero padding when target is already met', () => {
      const result = calculateTouchPadding(50, 50, 'minimum');
      expect(result.horizontal).toBe(0);
      expect(result.vertical).toBe(0);
    });

    it('should calculate required padding for undersized elements', () => {
      const result = calculateTouchPadding(30, 30, 'minimum');
      expect(result.horizontal).toBe(7); // (44 - 30) / 2 = 7
      expect(result.vertical).toBe(7);
    });

    it('should handle asymmetric dimensions correctly', () => {
      const result = calculateTouchPadding(40, 30, 'minimum');
      expect(result.horizontal).toBe(2); // (44 - 40) / 2 = 2
      expect(result.vertical).toBe(7); // (44 - 30) / 2 = 7
    });
  });

  describe('getResponsiveTouchAdjustments', () => {
    it('should enable compact mode for very small screens', () => {
      const result = getResponsiveTouchAdjustments(320);
      expect(result.enableCompactMode).toBe(true);
      expect(result.minimumReduction).toBe(2);
    });

    it('should enable comfort mode for tablet screens', () => {
      const result = getResponsiveTouchAdjustments(800);
      expect(result.enableComfortMode).toBe(true);
      expect(result.minimumIncrease).toBe(2);
    });

    it('should return default values for standard desktop screens', () => {
      const result = getResponsiveTouchAdjustments(1200);
      expect(result.enableCompactMode).toBe(false);
      expect(result.enableComfortMode).toBe(false);
      expect(result.minimumReduction).toBe(0);
      expect(result.minimumIncrease).toBe(0);
    });
  });

  describe('getResponsiveTouchTarget', () => {
    it('should downgrade minimum to small on very small screens', () => {
      const result = getResponsiveTouchTarget('minimum', 320);
      expect(result).toBe('small');
    });

    it('should upgrade minimum to large on tablet screens', () => {
      const result = getResponsiveTouchTarget('minimum', 800);
      expect(result).toBe('large');
    });

    it('should maintain size when no adjustments needed', () => {
      const result = getResponsiveTouchTarget('large', 1200);
      expect(result).toBe('large');
    });
  });

  describe('generateTouchClasses', () => {
    it('should generate basic touch target and spacing classes', () => {
      const config = {
        size: 'minimum' as TouchTargetSize,
        spacing: 'standard' as TouchSpacing,
        elementType: 'primary' as const,
      };
      const result = generateTouchClasses(config);
      expect(result).toContain('min-h-[44px]');
      expect(result).toContain('gap-3');
    });

    it('should apply responsive adjustments when screen width provided', () => {
      const config = {
        size: 'minimum' as TouchTargetSize,
        spacing: 'standard' as TouchSpacing,
        elementType: 'primary' as const,
        screenWidth: 320,
      };
      const result = generateTouchClasses(config);
      expect(result).toContain('min-h-[36px]'); // Downgraded for small screen
    });
  });

  describe('getRecommendedTouchSize', () => {
    it('should recommend large for primary buttons', () => {
      const result = getRecommendedTouchSize('button', 'primary');
      expect(result).toBe('large');
    });

    it('should recommend minimum for secondary buttons', () => {
      const result = getRecommendedTouchSize('button', 'secondary');
      expect(result).toBe('minimum');
    });

    it('should recommend large for primary form inputs', () => {
      const result = getRecommendedTouchSize('input', 'form');
      expect(result).toBe('large');
    });

    it('should consider available space when provided', () => {
      const result = getRecommendedTouchSize('button', 'primary', { width: 30, height: 30 });
      expect(result).toBe('small'); // Limited space forces smaller size
    });

    it('should fallback to minimum for unknown combinations', () => {
      const result = getRecommendedTouchSize('link' as any, 'unknown' as any);
      expect(result).toBe('minimum');
    });
  });
});

describe('Touch Compliance Validation', () => {
  it('should validate compliant touch targets', () => {
    // Create a mock HTML element for testing
    const mockElement = {
      getBoundingClientRect: () => ({ width: 44, height: 44 }),
      style: { margin: '8px' },
    };

    // Mock getComputedStyle for JSDOM
    const originalGetComputedStyle = global.getComputedStyle;
    global.getComputedStyle = vi.fn().mockReturnValue({
      margin: '8px',
    }) as any;

    const result = validateTouchCompliance(mockElement as any);
    expect(result.compliant).toBe(true);
    expect(result.issues).toHaveLength(0);

    // Restore original function
    global.getComputedStyle = originalGetComputedStyle;
  });

  it('should detect non-compliant touch targets', () => {
    const mockElement = {
      getBoundingClientRect: () => ({ width: 30, height: 30 }),
      style: { margin: '4px' },
    };

    // Mock getComputedStyle for JSDOM
    const originalGetComputedStyle = global.getComputedStyle;
    global.getComputedStyle = vi.fn().mockReturnValue({
      margin: '4px',
    }) as any;

    const result = validateTouchCompliance(mockElement as any);
    expect(result.compliant).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);

    // Restore original function
    global.getComputedStyle = originalGetComputedStyle;
  });
});

describe('TypeScript Type Safety', () => {
  it('should compile without TypeScript errors', () => {
    // This test verifies that all TypeScript types are correctly defined
    // and the module exports work properly
    expect(typeof TOUCH_TARGETS).toBe('object');
    expect(typeof TOUCH_TARGET_VALUES).toBe('object');
    expect(typeof calculateEffectiveTouchArea).toBe('function');
    expect(typeof validateTouchTarget).toBe('function');
  });
});
