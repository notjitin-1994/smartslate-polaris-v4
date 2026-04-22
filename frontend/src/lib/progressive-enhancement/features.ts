'use client';

export interface FeatureSupport {
  // CSS Features
  backdropFilter: boolean;
  gap: boolean;
  aspectRatio: boolean;
  containerQueries: boolean;
  customProperties: boolean;
  grid: boolean;
  flexbox: boolean;

  // JavaScript APIs
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  serviceWorker: boolean;
  webWorkers: boolean;
  fetch: boolean;
  promises: boolean;
  asyncAwait: boolean;

  // Device Capabilities
  touch: boolean;
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };

  // Graphics
  webGL: boolean;
  webGL2: boolean;
  canvas: boolean;

  // Performance
  performanceObserver: boolean;
  performanceMark: boolean;

  // Storage
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;

  // Media
  mediaQueries: boolean;
  pictureElement: boolean;
  webp: boolean;
  avif: boolean;

  // Accessibility
  prefersReducedMotion: boolean;
  prefersColorScheme: boolean;

  // Network
  offline: boolean;
  online: boolean;
}

/**
 * Detect CSS feature support using CSS.supports()
 */
function detectCSSSupport(): Partial<FeatureSupport> {
  if (typeof window === 'undefined' || !window.CSS?.supports) {
    return {};
  }

  return {
    backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    gap: CSS.supports('gap', '10px'),
    aspectRatio: CSS.supports('aspect-ratio', '1'),
    containerQueries: CSS.supports('container-type', 'inline-size'),
    customProperties: CSS.supports('--custom-property', 'value'),
    grid: CSS.supports('display', 'grid'),
    flexbox: CSS.supports('display', 'flex'),
  };
}

/**
 * Detect JavaScript API support
 */
function detectAPISupport(): Partial<FeatureSupport> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    mutationObserver: 'MutationObserver' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webWorkers: 'Worker' in window,
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    asyncAwait: true, // If we're running, async/await is supported
    performanceObserver: 'PerformanceObserver' in window,
    performanceMark: 'mark' in performance,
    indexedDB: 'indexedDB' in window,
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
    mediaQueries: 'matchMedia' in window,
    pictureElement: 'HTMLPictureElement' in window,
    webp: true, // We'll assume WebP is supported, can be tested with image loading
    avif: true, // We'll assume AVIF is supported, can be tested with image loading
    prefersReducedMotion:
      'matchMedia' in window && window.matchMedia('(prefers-reduced-motion)').matches !== undefined,
    prefersColorScheme:
      'matchMedia' in window && window.matchMedia('(prefers-color-scheme)').matches !== undefined,
    offline: 'onLine' in navigator,
    online: 'onLine' in navigator,
  };
}

/**
 * Detect device capabilities
 */
function detectDeviceCapabilities(): Partial<FeatureSupport> {
  if (typeof navigator === 'undefined') {
    return {};
  }

  return {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    deviceMemory: (navigator as any).deviceMemory,
    connection: (navigator as any).connection
      ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        }
      : undefined,
  };
}

/**
 * Detect graphics capabilities
 */
function detectGraphicsCapabilities(): Partial<FeatureSupport> {
  if (typeof document === 'undefined') {
    return {};
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const gl2 = canvas.getContext('webgl2');

  return {
    webGL: !!gl,
    webGL2: !!gl2,
    canvas: !!canvas.getContext('2d'),
  };
}

/**
 * Get comprehensive feature support for the current environment
 */
export function getFeatureSupport(): FeatureSupport {
  return {
    // CSS Features
    ...detectCSSSupport(),

    // JavaScript APIs
    ...detectAPISupport(),

    // Device Capabilities
    ...detectDeviceCapabilities(),

    // Graphics
    ...detectGraphicsCapabilities(),
  };
}

/**
 * Check if a specific feature is supported
 */
export function isFeatureSupported(feature: keyof FeatureSupport): boolean {
  const support = getFeatureSupport();
  return support[feature] === true;
}

/**
 * Get enhancement level based on detected capabilities
 */
export type EnhancementLevel = 'basic' | 'standard' | 'full';

export function getEnhancementLevel(): EnhancementLevel {
  const support = getFeatureSupport();

  // Basic level: Core functionality, no advanced features
  const hasBasicSupport =
    support.flexbox && support.promises && support.fetch && support.localStorage;

  if (!hasBasicSupport) {
    return 'basic';
  }

  // Standard level: Most modern features but not cutting-edge
  const hasStandardSupport =
    support.backdropFilter &&
    support.gap &&
    support.intersectionObserver &&
    support.resizeObserver &&
    support.serviceWorker;

  if (!hasStandardSupport) {
    return 'standard';
  }

  // Full level: All features including advanced graphics
  const hasFullSupport =
    support.webGL && support.webGL2 && support.containerQueries && support.aspectRatio;

  return hasFullSupport ? 'full' : 'standard';
}

/**
 * Performance budget based on enhancement level and device capabilities
 */
export function getPerformanceBudget(): {
  maxBundleSize: number;
  maxImageSize: number;
  maxAnimationComplexity: number;
  recommendedImageFormat: 'jpeg' | 'webp' | 'avif';
} {
  const level = getEnhancementLevel();
  const support = getFeatureSupport();

  switch (level) {
    case 'basic':
      return {
        maxBundleSize: 100 * 1024, // 100KB
        maxImageSize: 50 * 1024, // 50KB
        maxAnimationComplexity: 1, // Simple animations only
        recommendedImageFormat: 'jpeg',
      };

    case 'standard':
      return {
        maxBundleSize: 300 * 1024, // 300KB
        maxImageSize: 150 * 1024, // 150KB
        maxAnimationComplexity: 2, // Moderate animations
        recommendedImageFormat: support.webp ? 'webp' : 'jpeg',
      };

    case 'full':
    default:
      return {
        maxBundleSize: 500 * 1024, // 500KB
        maxImageSize: 300 * 1024, // 300KB
        maxAnimationComplexity: 3, // Complex animations allowed
        recommendedImageFormat: support.avif ? 'avif' : support.webp ? 'webp' : 'jpeg',
      };
  }
}
