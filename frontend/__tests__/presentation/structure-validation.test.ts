/**
 * Presentation Directory Structure Validation Tests
 * Verifies that all barrel exports, imports, and directory structure are correct
 */

import { describe, it, expect } from 'vitest';

describe('Presentation Directory Structure', () => {
  describe('Type Definitions', () => {
    it('should export all presentation types', async () => {
      const types = await import('@/types/presentation');

      // Check base types exist
      expect(types.isCoverSlide).toBeDefined();
      expect(types.isSectionSlide).toBeDefined();
      expect(types.isContentSlide).toBeDefined();
      expect(types.isMetricsSlide).toBeDefined();
      expect(types.isModuleSlide).toBeDefined();
      expect(types.isTimelineSlide).toBeDefined();
      expect(types.isResourcesSlide).toBeDefined();
      expect(types.isChartSlide).toBeDefined();
      expect(types.DEFAULT_PRESENTATION_SETTINGS).toBeDefined();
    });
  });

  describe('Hooks Barrel Exports', () => {
    it('should export all presentation hooks from hooks/index.ts', async () => {
      const hooks = await import('@/components/presentation/hooks');

      expect(hooks.usePresentation).toBeDefined();
      expect(hooks.useFullscreen).toBeDefined();
      expect(hooks.useKeyboardShortcuts).toBeDefined();
      expect(hooks.useSlideNavigation).toBeDefined();
      expect(hooks.useLaserPointer).toBeDefined();
      expect(hooks.useSpeakerNotes).toBeDefined();
    });

    it('should import individual hooks directly', async () => {
      const { usePresentation } = await import('@/components/presentation/hooks/usePresentation');
      const { useFullscreen } = await import('@/components/presentation/hooks/useFullscreen');
      const { useKeyboardShortcuts } = await import(
        '@/components/presentation/hooks/useKeyboardShortcuts'
      );
      const { useSlideNavigation } = await import(
        '@/components/presentation/hooks/useSlideNavigation'
      );
      const { useLaserPointer } = await import('@/components/presentation/hooks/useLaserPointer');
      const { useSpeakerNotes } = await import('@/components/presentation/hooks/useSpeakerNotes');

      expect(usePresentation).toBeDefined();
      expect(useFullscreen).toBeDefined();
      expect(useKeyboardShortcuts).toBeDefined();
      expect(useSlideNavigation).toBeDefined();
      expect(useLaserPointer).toBeDefined();
      expect(useSpeakerNotes).toBeDefined();
    });
  });

  describe('Utilities Barrel Exports', () => {
    it('should export all utilities from lib/presentation/utils', async () => {
      const utils = await import('@/lib/presentation/utils');

      // Navigation utilities
      expect(utils.calculateNextSlideIndex).toBeDefined();
      expect(utils.getTransitionDirection).toBeDefined();
      expect(utils.canNavigate).toBeDefined();
      expect(utils.calculateProgress).toBeDefined();

      // Fullscreen API
      expect(utils.isFullscreenSupported).toBeDefined();
      expect(utils.getFullscreenElement).toBeDefined();
      expect(utils.requestFullscreen).toBeDefined();
      expect(utils.exitFullscreen).toBeDefined();
      expect(utils.toggleFullscreen).toBeDefined();

      // Gestures
      expect(utils.calculateSwipeGesture).toBeDefined();
      expect(utils.isHorizontalSwipe).toBeDefined();
      expect(utils.isVerticalSwipe).toBeDefined();
      expect(utils.throttle).toBeDefined();
      expect(utils.debounce).toBeDefined();

      // Analytics
      expect(utils.createAnalyticsSession).toBeDefined();
      expect(utils.trackSlideView).toBeDefined();
      expect(utils.trackInteraction).toBeDefined();
      expect(utils.calculateCompletion).toBeDefined();
    });
  });

  describe('Parsers Barrel Exports', () => {
    it('should export blueprint parser from lib/presentation/parsers', async () => {
      const parsers = await import('@/lib/presentation/parsers');

      expect(parsers.parseBlueprint).toBeDefined();
      expect(parsers.filterEmptySlides).toBeDefined();
      expect(parsers.validateSlide).toBeDefined();
      expect(parsers.generateSlideId).toBeDefined();
    });
  });

  describe('Main Library Export', () => {
    it('should export all utilities and parsers from lib/presentation', async () => {
      const lib = await import('@/lib/presentation');

      // Should have utilities
      expect(lib.calculateNextSlideIndex).toBeDefined();
      expect(lib.isFullscreenSupported).toBeDefined();
      expect(lib.calculateSwipeGesture).toBeDefined();
      expect(lib.createAnalyticsSession).toBeDefined();

      // Should have parsers
      expect(lib.parseBlueprint).toBeDefined();
      expect(lib.filterEmptySlides).toBeDefined();
    });
  });

  describe('Component Barrel Exports', () => {
    it('should export presentation components from components/index.ts', async () => {
      const components = await import('@/components/presentation/components');

      expect(components.PresentationControls).toBeDefined();
      expect(components.SpeakerNotes).toBeDefined();
    });
  });

  describe('Layout Barrel Exports', () => {
    it('should export all slide layouts from layouts/index.ts', async () => {
      const layouts = await import('@/components/presentation/layouts');

      expect(layouts.CoverSlide).toBeDefined();
      expect(layouts.SectionSlide).toBeDefined();
      expect(layouts.ContentSlide).toBeDefined();
      expect(layouts.MetricsSlide).toBeDefined();
      expect(layouts.ModuleSlide).toBeDefined();
      expect(layouts.TimelineSlide).toBeDefined();
      expect(layouts.ResourcesSlide).toBeDefined();
      expect(layouts.ChartSlide).toBeDefined();
    });
  });

  describe('Main Presentation Export', () => {
    it('should export PresentationMode from main index', async () => {
      const main = await import('@/components/presentation');

      expect(main.PresentationMode).toBeDefined();
    });
  });
});

describe('Type Safety', () => {
  it('should have proper TypeScript types for all exports', async () => {
    const types = await import('@/types/presentation');

    // Verify type guards are functions
    expect(typeof types.isCoverSlide).toBe('function');
    expect(typeof types.isSectionSlide).toBe('function');
    expect(typeof types.isContentSlide).toBe('function');

    // Verify default settings is an object
    expect(typeof types.DEFAULT_PRESENTATION_SETTINGS).toBe('object');
    expect(types.DEFAULT_PRESENTATION_SETTINGS.theme).toBe('dark');
    expect(types.DEFAULT_PRESENTATION_SETTINGS.fontSize).toBe('medium');
    expect(types.DEFAULT_PRESENTATION_SETTINGS.animations).toBe(true);
  });
});

describe('Functional Validation', () => {
  describe('Navigation Utilities', () => {
    it('should calculate next slide index correctly', async () => {
      const { calculateNextSlideIndex } = await import('@/lib/presentation/utils/slideNavigation');

      expect(calculateNextSlideIndex(0, 'next', 10)).toBe(1);
      expect(calculateNextSlideIndex(5, 'previous', 10)).toBe(4);
      expect(calculateNextSlideIndex(5, 'first', 10)).toBe(0);
      expect(calculateNextSlideIndex(5, 'last', 10)).toBe(9);
      expect(calculateNextSlideIndex(9, 'next', 10, undefined, false)).toBe(9); // No loop
      expect(calculateNextSlideIndex(9, 'next', 10, undefined, true)).toBe(0); // With loop
    });

    it('should calculate progress correctly', async () => {
      const { calculateProgress } = await import('@/lib/presentation/utils/slideNavigation');

      expect(calculateProgress(0, 10)).toBe(10);
      expect(calculateProgress(4, 10)).toBe(50);
      expect(calculateProgress(9, 10)).toBe(100);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify slide types', async () => {
      const types = await import('@/types/presentation');

      const coverSlide: types.CoverSlideContent = {
        id: 'test',
        type: 'cover',
        title: 'Test',
        mainTitle: 'Test Cover',
      };

      const contentSlide: types.ContentSlideContent = {
        id: 'test',
        type: 'content',
        title: 'Test',
        content: 'Test content',
      };

      expect(types.isCoverSlide(coverSlide)).toBe(true);
      expect(types.isCoverSlide(contentSlide)).toBe(false);
      expect(types.isContentSlide(contentSlide)).toBe(true);
      expect(types.isContentSlide(coverSlide)).toBe(false);
    });
  });

  describe('Blueprint Parser', () => {
    it('should parse blueprint data to slides', async () => {
      const { parseBlueprint } = await import('@/lib/presentation/parsers/blueprintToSlides');

      const blueprintData = {
        title: 'Test Blueprint',
        overview: {
          description: 'Test description',
        },
        learningObjectives: ['Objective 1', 'Objective 2'],
      };

      const slides = parseBlueprint(blueprintData);

      expect(Array.isArray(slides)).toBe(true);
      expect(slides.length).toBeGreaterThan(0);
      expect(slides[0].type).toBe('cover');
      expect(slides[0].title).toBe('Test Blueprint');
    });
  });
});
