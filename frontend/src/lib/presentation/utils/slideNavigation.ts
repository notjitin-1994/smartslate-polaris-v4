import type { NavigationDirection, SlideContent } from '@/types/presentation';

/**
 * Navigation helper utilities for presentation mode
 */

/**
 * Calculate next slide index based on navigation direction
 */
export function calculateNextSlideIndex(
  currentIndex: number,
  direction: NavigationDirection,
  totalSlides: number,
  targetIndex?: number,
  loop = false
): number {
  let nextIndex = currentIndex;

  switch (direction) {
    case 'next':
      nextIndex = currentIndex + 1;
      if (loop && nextIndex >= totalSlides) {
        nextIndex = 0;
      } else {
        nextIndex = Math.min(nextIndex, totalSlides - 1);
      }
      break;

    case 'previous':
      nextIndex = currentIndex - 1;
      if (loop && nextIndex < 0) {
        nextIndex = totalSlides - 1;
      } else {
        nextIndex = Math.max(nextIndex, 0);
      }
      break;

    case 'first':
      nextIndex = 0;
      break;

    case 'last':
      nextIndex = totalSlides - 1;
      break;

    case 'goto':
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex < totalSlides) {
        nextIndex = targetIndex;
      }
      break;
  }

  return nextIndex;
}

/**
 * Get navigation transition direction
 */
export function getTransitionDirection(fromIndex: number, toIndex: number): 'forward' | 'backward' {
  return toIndex > fromIndex ? 'forward' : 'backward';
}

/**
 * Check if navigation is possible in a given direction
 */
export function canNavigate(
  currentIndex: number,
  direction: NavigationDirection,
  totalSlides: number,
  loop = false
): boolean {
  if (direction === 'goto') return true;
  if (direction === 'first' || direction === 'last') return true;
  if (loop) return true;

  if (direction === 'next') {
    return currentIndex < totalSlides - 1;
  }

  if (direction === 'previous') {
    return currentIndex > 0;
  }

  return false;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentIndex: number, totalSlides: number): number {
  if (totalSlides === 0) return 0;
  return Math.round(((currentIndex + 1) / totalSlides) * 100);
}

/**
 * Get slide range for current view (useful for slide thumbnails/navigation)
 */
export function getSlideRange(
  currentIndex: number,
  totalSlides: number,
  rangeSize = 5
): { start: number; end: number } {
  const halfRange = Math.floor(rangeSize / 2);
  let start = Math.max(0, currentIndex - halfRange);
  let end = Math.min(totalSlides - 1, currentIndex + halfRange);

  // Adjust if at the beginning or end
  if (end - start + 1 < rangeSize) {
    if (start === 0) {
      end = Math.min(totalSlides - 1, start + rangeSize - 1);
    } else if (end === totalSlides - 1) {
      start = Math.max(0, end - rangeSize + 1);
    }
  }

  return { start, end };
}

/**
 * Find slide index by ID
 */
export function findSlideIndexById(slides: SlideContent[], slideId: string): number {
  return slides.findIndex((slide) => slide.id === slideId);
}

/**
 * Get slides by type
 */
export function getSlidesByType(
  slides: SlideContent[],
  type: SlideContent['type']
): SlideContent[] {
  return slides.filter((slide) => slide.type === type);
}

/**
 * Format elapsed time (milliseconds to MM:SS)
 */
export function formatElapsedTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Estimate total presentation duration
 */
export function estimateTotalDuration(slides: SlideContent[]): number {
  return slides.reduce((total, slide) => {
    return total + (slide.duration || 0);
  }, 0);
}
