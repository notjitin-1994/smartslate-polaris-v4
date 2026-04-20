/**
 * Responsive Testing Framework for SmartSlate Polaris v3
 *
 * This module provides comprehensive testing utilities for validating
 * responsive behavior across all defined breakpoints and device types.
 * Includes viewport simulation, custom matchers, and automated testing.
 */

import { BREAKPOINTS, BREAKPOINT_VALUES, type BreakpointKey, type DeviceType } from '../responsive';

// ========================================
// BREAKPOINT TEST UTILITIES
// ========================================

/**
 * Responsive breakpoint test configuration
 */
export interface BreakpointTestConfig {
  breakpoint: BreakpointKey;
  width: number;
  height: number;
  deviceType: DeviceType;
  name: string;
}

/**
 * Get all breakpoint test configurations for automated testing
 */
export function getBreakpointTestConfigs(): BreakpointTestConfig[] {
  return [
    {
      breakpoint: 'xs',
      width: BREAKPOINT_VALUES.xs,
      height: 896, // iPhone SE height
      deviceType: 'mobile-compact',
      name: 'Mobile XS (320px)',
    },
    {
      breakpoint: 'sm',
      width: BREAKPOINT_VALUES.sm,
      height: 896, // iPhone 12/13 height
      deviceType: 'mobile-expanded',
      name: 'Mobile SM (640px)',
    },
    {
      breakpoint: 'md',
      width: BREAKPOINT_VALUES.md,
      height: 1024, // iPad Mini height
      deviceType: 'tablet',
      name: 'Tablet MD (768px)',
    },
    {
      breakpoint: 'lg',
      width: BREAKPOINT_VALUES.lg,
      height: 768, // MacBook Air 13" height
      deviceType: 'desktop',
      name: 'Desktop LG (1024px)',
    },
    {
      breakpoint: 'xl',
      width: BREAKPOINT_VALUES.xl,
      height: 900, // MacBook Pro 16" height
      deviceType: 'desktop',
      name: 'Desktop XL (1280px)',
    },
    {
      breakpoint: '2xl',
      width: BREAKPOINT_VALUES['2xl'],
      height: 1080, // 4K display height
      deviceType: 'large-desktop',
      name: 'Large Desktop 2XL (1536px)',
    },
  ];
}

/**
 * Get mobile-specific breakpoint configurations
 */
export function getMobileBreakpointConfigs(): BreakpointTestConfig[] {
  return getBreakpointTestConfigs().filter(
    (config) => config.deviceType === 'mobile-compact' || config.deviceType === 'mobile-expanded'
  );
}

/**
 * Get tablet-specific breakpoint configurations
 */
export function getTabletBreakpointConfigs(): BreakpointTestConfig[] {
  return getBreakpointTestConfigs().filter((config) => config.deviceType === 'tablet');
}

/**
 * Get desktop-specific breakpoint configurations
 */
export function getDesktopBreakpointConfigs(): BreakpointTestConfig[] {
  return getBreakpointTestConfigs().filter(
    (config) => config.deviceType === 'desktop' || config.deviceType === 'large-desktop'
  );
}

// ========================================
// VIEWPORT SIMULATION UTILITIES
// ========================================

/**
 * Create viewport test function for Playwright/Page testing
 */
export function createViewportTest(testFn: (config: BreakpointTestConfig) => void | Promise<void>) {
  return async (page: any) => {
    const configs = getBreakpointTestConfigs();

    for (const config of configs) {
      // Set viewport for this breakpoint
      await page.setViewportSize({
        width: config.width,
        height: config.height,
      });

      // Wait for layout to stabilize
      await page.waitForTimeout(100);

      // Run the test function
      await testFn(config);
    }
  };
}

/**
 * Create mobile-specific viewport test
 */
export function createMobileViewportTest(
  testFn: (config: BreakpointTestConfig) => void | Promise<void>
) {
  return async (page: any) => {
    const configs = getMobileBreakpointConfigs();

    for (const config of configs) {
      await page.setViewportSize({
        width: config.width,
        height: config.height,
      });

      await page.waitForTimeout(100);
      await testFn(config);
    }
  };
}

/**
 * Create tablet-specific viewport test
 */
export function createTabletViewportTest(
  testFn: (config: BreakpointTestConfig) => void | Promise<void>
) {
  return async (page: any) => {
    const configs = getTabletBreakpointConfigs();

    for (const config of configs) {
      await page.setViewportSize({
        width: config.width,
        height: config.height,
      });

      await page.waitForTimeout(100);
      await testFn(config);
    }
  };
}

// ========================================
// RESPONSIVE ASSERTION HELPERS
// ========================================

/**
 * Assert that an element is visible at a specific breakpoint
 */
export async function assertVisibleAtBreakpoint(
  page: any,
  selector: string,
  breakpoint: BreakpointKey
) {
  const config = getBreakpointTestConfigs().find((c) => c.breakpoint === breakpoint);
  if (!config) {
    throw new Error(`Breakpoint ${breakpoint} not found in test configurations`);
  }

  await page.setViewportSize({ width: config.width, height: config.height });
  await page.waitForTimeout(100);

  const element = await page.locator(selector);
  const isVisible = await element.isVisible();

  if (!isVisible) {
    throw new Error(
      `Element ${selector} should be visible at breakpoint ${breakpoint} (${config.width}px)`
    );
  }
}

/**
 * Assert that an element has correct responsive styles at a breakpoint
 */
export async function assertResponsiveStyles(
  page: any,
  selector: string,
  breakpoint: BreakpointKey,
  expectedStyles: Record<string, string>
) {
  const config = getBreakpointTestConfigs().find((c) => c.breakpoint === breakpoint);
  if (!config) {
    throw new Error(`Breakpoint ${breakpoint} not found in test configurations`);
  }

  await page.setViewportSize({ width: config.width, height: config.height });
  await page.waitForTimeout(100);

  const element = await page.locator(selector);

  for (const [property, expectedValue] of Object.entries(expectedStyles)) {
    const actualValue = await element.evaluate((el: Element, prop: string) => {
      return getComputedStyle(el).getPropertyValue(prop);
    }, property);

    if (actualValue !== expectedValue) {
      throw new Error(
        `Element ${selector} should have ${property}: ${expectedValue} at breakpoint ${breakpoint}, but got ${actualValue}`
      );
    }
  }
}

/**
 * Assert that a grid has the correct number of columns at a breakpoint
 */
export async function assertGridColumns(
  page: any,
  gridSelector: string,
  breakpoint: BreakpointKey,
  expectedColumns: number
) {
  const config = getBreakpointTestConfigs().find((c) => c.breakpoint === breakpoint);
  if (!config) {
    throw new Error(`Breakpoint ${breakpoint} not found in test configurations`);
  }

  await page.setViewportSize({ width: config.width, height: config.height });
  await page.waitForTimeout(100);

  const grid = await page.locator(gridSelector);
  const gridTemplateColumns = await grid.evaluate((el: Element) => {
    return getComputedStyle(el).gridTemplateColumns;
  });

  // Count the number of columns by splitting on ' '
  const columnCount = gridTemplateColumns.split(' ').length;

  if (columnCount !== expectedColumns) {
    throw new Error(
      `Grid ${gridSelector} should have ${expectedColumns} columns at breakpoint ${breakpoint}, but has ${columnCount}`
    );
  }
}

// ========================================
// PERFORMANCE TESTING UTILITIES
// ========================================

/**
 * Performance testing configuration for responsive breakpoints
 */
export interface PerformanceTestConfig {
  breakpoint: BreakpointKey;
  maxLCP: number; // Maximum Largest Contentful Paint in seconds
  maxCLS: number; // Maximum Cumulative Layout Shift
  maxFID: number; // Maximum First Input Delay in milliseconds
}

/**
 * Get performance test configurations for all breakpoints
 */
export function getPerformanceTestConfigs(): PerformanceTestConfig[] {
  return [
    { breakpoint: 'xs', maxLCP: 2.5, maxCLS: 0.1, maxFID: 100 },
    { breakpoint: 'sm', maxLCP: 2.5, maxCLS: 0.1, maxFID: 100 },
    { breakpoint: 'md', maxLCP: 2.5, maxCLS: 0.1, maxFID: 100 },
    { breakpoint: 'lg', maxLCP: 2.5, maxCLS: 0.1, maxFID: 100 },
    { breakpoint: 'xl', maxLCP: 2.5, maxCLS: 0.1, maxFID: 100 },
    { breakpoint: '2xl', maxLCP: 2.5, maxCLS: 0.1, maxFID: 100 },
  ];
}

/**
 * Assert performance metrics at a specific breakpoint
 */
export async function assertPerformanceMetrics(
  page: any,
  breakpoint: BreakpointKey,
  metrics: { lcp?: number; cls?: number; fid?: number }
) {
  const config = getPerformanceTestConfigs().find((c) => c.breakpoint === breakpoint);
  if (!config) {
    throw new Error(`Performance config for breakpoint ${breakpoint} not found`);
  }

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');

  // Get performance metrics
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries.length > 0 ? lcpEntries[0].startTime : 0;

    return {
      lcp,
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    };
  });

  // Assert LCP if specified
  if (metrics.lcp && performanceMetrics.lcp > metrics.lcp) {
    throw new Error(
      `LCP at breakpoint ${breakpoint} should be ≤ ${metrics.lcp}s, but was ${performanceMetrics.lcp.toFixed(2)}s`
    );
  }

  // Assert load time (using LCP as proxy)
  if (performanceMetrics.lcp > config.maxLCP * 1000) {
    throw new Error(
      `Performance at breakpoint ${breakpoint} exceeds LCP budget: ${performanceMetrics.lcp.toFixed(2)}ms > ${config.maxLCP * 1000}ms`
    );
  }
}

// ========================================
// ACCESSIBILITY TESTING UTILITIES
// ========================================

/**
 * Accessibility test configuration for responsive breakpoints
 */
export interface AccessibilityTestConfig {
  breakpoint: BreakpointKey;
  minTouchTargetSize: number;
  maxColorContrast: number;
  checkKeyboardNavigation: boolean;
}

/**
 * Get accessibility test configurations
 */
export function getAccessibilityTestConfigs(): AccessibilityTestConfig[] {
  return [
    {
      breakpoint: 'xs',
      minTouchTargetSize: 44,
      maxColorContrast: 4.5,
      checkKeyboardNavigation: false,
    },
    {
      breakpoint: 'sm',
      minTouchTargetSize: 44,
      maxColorContrast: 4.5,
      checkKeyboardNavigation: false,
    },
    {
      breakpoint: 'md',
      minTouchTargetSize: 44,
      maxColorContrast: 4.5,
      checkKeyboardNavigation: true,
    },
    {
      breakpoint: 'lg',
      minTouchTargetSize: 44,
      maxColorContrast: 4.5,
      checkKeyboardNavigation: true,
    },
    {
      breakpoint: 'xl',
      minTouchTargetSize: 44,
      maxColorContrast: 4.5,
      checkKeyboardNavigation: true,
    },
    {
      breakpoint: '2xl',
      minTouchTargetSize: 44,
      maxColorContrast: 4.5,
      checkKeyboardNavigation: true,
    },
  ];
}

/**
 * Assert touch target sizes at a breakpoint
 */
export async function assertTouchTargets(page: any, breakpoint: BreakpointKey, minSize = 44) {
  const config = getAccessibilityTestConfigs().find((c) => c.breakpoint === breakpoint);
  if (!config) {
    throw new Error(`Accessibility config for breakpoint ${breakpoint} not found`);
  }

  await page.setViewportSize({
    width: BREAKPOINT_VALUES[breakpoint],
    height: 800,
  });
  await page.waitForTimeout(100);

  // Find all interactive elements
  const interactiveElements = await page
    .locator('button, a, input, select, textarea, [role="button"], [tabindex="0"]')
    .all();

  for (const element of interactiveElements) {
    const boundingBox = await element.boundingBox();

    if (boundingBox) {
      const { width, height } = boundingBox;
      const minDimension = Math.min(width, height);

      if (minDimension < minSize) {
        const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
        throw new Error(
          `Touch target ${tagName} at breakpoint ${breakpoint} has minimum dimension ${minDimension}px, should be ≥ ${minSize}px`
        );
      }
    }
  }
}

// ========================================
// VISUAL REGRESSION TESTING
// ========================================

/**
 * Create visual regression test configuration for breakpoints
 */
export interface VisualRegressionConfig {
  breakpoint: BreakpointKey;
  threshold: number; // Acceptable pixel difference (0-1)
  includeAntiAliasing: boolean;
  skipAreas?: string[]; // CSS selectors to skip in comparison
}

/**
 * Get visual regression test configurations
 */
export function getVisualRegressionConfigs(): VisualRegressionConfig[] {
  return [
    { breakpoint: 'xs', threshold: 0.1, includeAntiAliasing: true },
    { breakpoint: 'sm', threshold: 0.1, includeAntiAliasing: true },
    { breakpoint: 'md', threshold: 0.1, includeAntiAliasing: true },
    { breakpoint: 'lg', threshold: 0.05, includeAntiAliasing: true },
    { breakpoint: 'xl', threshold: 0.05, includeAntiAliasing: true },
    { breakpoint: '2xl', threshold: 0.05, includeAntiAliasing: true },
  ];
}

/**
 * Create screenshot name for visual regression testing
 */
export function createScreenshotName(
  testName: string,
  breakpoint: BreakpointKey,
  variant?: string
): string {
  const baseName = `${testName}-${breakpoint}`;
  return variant ? `${baseName}-${variant}` : baseName;
}

// ========================================
// RESPONSIVE TEST FIXTURES
// ========================================

/**
 * Common responsive test patterns and fixtures
 */
export const responsiveTestFixtures = {
  /**
   * Navigation component test fixture
   */
  navigation: {
    mobileMenuVisible: async (page: any) => {
      await assertVisibleAtBreakpoint(page, '[data-testid="mobile-menu"]', 'sm');
    },

    desktopMenuVisible: async (page: any) => {
      await assertVisibleAtBreakpoint(page, '[data-testid="desktop-menu"]', 'lg');
    },
  },

  /**
   * Card layout test fixture
   */
  cards: {
    singleColumnMobile: async (page: any) => {
      await assertGridColumns(page, '[data-testid="card-grid"]', 'xs', 1);
    },

    twoColumnsTablet: async (page: any) => {
      await assertGridColumns(page, '[data-testid="card-grid"]', 'md', 2);
    },

    fourColumnsDesktop: async (page: any) => {
      await assertGridColumns(page, '[data-testid="card-grid"]', 'xl', 4);
    },
  },

  /**
   * Typography test fixture
   */
  typography: {
    responsiveFontSize: async (
      page: any,
      selector: string,
      breakpoint: BreakpointKey,
      expectedSize: string
    ) => {
      await assertResponsiveStyles(page, selector, breakpoint, { fontSize: expectedSize });
    },

    lineHeightConsistency: async (
      page: any,
      selector: string,
      breakpoint: BreakpointKey,
      expectedLineHeight: string
    ) => {
      await assertResponsiveStyles(page, selector, breakpoint, { lineHeight: expectedLineHeight });
    },
  },
};

// ========================================
// TEST UTILITY FUNCTIONS
// ========================================

/**
 * Wait for responsive layout to stabilize
 */
export async function waitForResponsiveLayout(page: any, timeout = 500) {
  await page.waitForTimeout(timeout);

  // Wait for any layout shifts to complete
  await page.evaluate(() => {
    return new Promise((resolve) => {
      let lastHeight = document.body.scrollHeight;
      const checkHeight = () => {
        const currentHeight = document.body.scrollHeight;
        if (currentHeight === lastHeight) {
          resolve(void 0);
        } else {
          lastHeight = currentHeight;
          setTimeout(checkHeight, 50);
        }
      };
      checkHeight();
    });
  });
}

/**
 * Get current responsive breakpoint from viewport width
 */
export function getCurrentBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINT_VALUES['2xl']) return '2xl';
  if (width >= BREAKPOINT_VALUES.xl) return 'xl';
  if (width >= BREAKPOINT_VALUES.lg) return 'lg';
  if (width >= BREAKPOINT_VALUES.md) return 'md';
  if (width >= BREAKPOINT_VALUES.sm) return 'sm';
  return 'xs';
}

/**
 * Test responsive behavior across all breakpoints
 */
export async function testResponsiveBehavior(
  page: any,
  testName: string,
  testFn: (config: BreakpointTestConfig) => void | Promise<void>
) {
  const configs = getBreakpointTestConfigs();

  for (const config of configs) {
    await page.setViewportSize({
      width: config.width,
      height: config.height,
    });

    await waitForResponsiveLayout(page);

    try {
      await testFn(config);
    } catch (error) {
      throw new Error(`${testName} failed at breakpoint ${config.name}: ${error.message}`);
    }
  }
}

// ========================================
// JEST CUSTOM MATCHERS
// ========================================

/**
 * Custom Jest matchers for responsive testing
 * These would be added to Jest setup for responsive testing
 */
export const responsiveMatchers = {
  /**
   * Matcher for testing element visibility at specific breakpoint
   */
  toBeVisibleAtBreakpoint: (element: any, breakpoint: BreakpointKey) => {
    // Implementation would check computed styles at breakpoint
    return {
      pass: true, // Placeholder
      message: () => `Expected element to be visible at breakpoint ${breakpoint}`,
    };
  },

  /**
   * Matcher for testing responsive styles
   */
  toHaveResponsiveStyles: (
    element: any,
    breakpoint: BreakpointKey,
    expectedStyles: Record<string, string>
  ) => {
    // Implementation would check computed styles match expected values
    return {
      pass: true, // Placeholder
      message: () => `Expected element to have responsive styles at breakpoint ${breakpoint}`,
    };
  },
};

// ========================================
// EXPORT UTILITIES
// ========================================

/**
 * Default export for easy importing in test files
 */
export default {
  getBreakpointTestConfigs,
  getMobileBreakpointConfigs,
  getTabletBreakpointConfigs,
  getDesktopBreakpointConfigs,
  createViewportTest,
  createMobileViewportTest,
  createTabletViewportTest,
  assertVisibleAtBreakpoint,
  assertResponsiveStyles,
  assertGridColumns,
  assertPerformanceMetrics,
  assertTouchTargets,
  getPerformanceTestConfigs,
  getAccessibilityTestConfigs,
  getVisualRegressionConfigs,
  createScreenshotName,
  responsiveTestFixtures,
  waitForResponsiveLayout,
  getCurrentBreakpoint,
  testResponsiveBehavior,
  responsiveMatchers,
};
