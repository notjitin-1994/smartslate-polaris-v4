import type { PresentationAnalytics, SlideContent } from '@/types/presentation';

/**
 * Presentation analytics tracking utilities
 */

/**
 * Create new analytics session
 */
export function createAnalyticsSession(presentationId: string): PresentationAnalytics {
  return {
    presentationId,
    sessionId: generateSessionId(),
    startTime: new Date(),
    slideViews: [],
    interactions: [],
    completion: 0,
  };
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Track slide view
 */
export function trackSlideView(
  analytics: PresentationAnalytics,
  slideIndex: number,
  slideId: string,
  viewTime: number
): PresentationAnalytics {
  return {
    ...analytics,
    slideViews: [
      ...analytics.slideViews,
      {
        slideIndex,
        slideId,
        viewTime,
        timestamp: new Date(),
      },
    ],
  };
}

/**
 * Track interaction
 */
export function trackInteraction(
  analytics: PresentationAnalytics,
  type: PresentationAnalytics['interactions'][0]['type'],
  data?: Record<string, unknown>
): PresentationAnalytics {
  return {
    ...analytics,
    interactions: [
      ...analytics.interactions,
      {
        type,
        timestamp: new Date(),
        data,
      },
    ],
  };
}

/**
 * Calculate completion percentage
 */
export function calculateCompletion(
  slideViews: PresentationAnalytics['slideViews'],
  totalSlides: number
): number {
  if (totalSlides === 0) return 0;

  const uniqueSlides = new Set(slideViews.map((view) => view.slideIndex));
  return Math.round((uniqueSlides.size / totalSlides) * 100);
}

/**
 * End analytics session
 */
export function endAnalyticsSession(analytics: PresentationAnalytics): PresentationAnalytics {
  const completion = calculateCompletion(analytics.slideViews, analytics.slideViews.length);

  return {
    ...analytics,
    endTime: new Date(),
    completion,
  };
}

/**
 * Get average time per slide
 */
export function getAverageTimePerSlide(slideViews: PresentationAnalytics['slideViews']): number {
  if (slideViews.length === 0) return 0;

  const totalTime = slideViews.reduce((sum, view) => sum + view.viewTime, 0);
  return Math.round(totalTime / slideViews.length);
}

/**
 * Get most viewed slides
 */
export function getMostViewedSlides(
  slideViews: PresentationAnalytics['slideViews'],
  limit = 5
): Array<{ slideIndex: number; slideId: string; viewCount: number; totalTime: number }> {
  const slideStats = new Map<number, { slideId: string; viewCount: number; totalTime: number }>();

  slideViews.forEach((view) => {
    const existing = slideStats.get(view.slideIndex);
    if (existing) {
      existing.viewCount++;
      existing.totalTime += view.viewTime;
    } else {
      slideStats.set(view.slideIndex, {
        slideId: view.slideId,
        viewCount: 1,
        totalTime: view.viewTime,
      });
    }
  });

  return Array.from(slideStats.entries())
    .map(([slideIndex, stats]) => ({
      slideIndex,
      ...stats,
    }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

/**
 * Get interaction counts by type
 */
export function getInteractionCounts(
  interactions: PresentationAnalytics['interactions']
): Record<string, number> {
  const counts: Record<string, number> = {};

  interactions.forEach((interaction) => {
    counts[interaction.type] = (counts[interaction.type] || 0) + 1;
  });

  return counts;
}

/**
 * Export analytics to JSON
 */
export function exportAnalytics(analytics: PresentationAnalytics): string {
  return JSON.stringify(analytics, null, 2);
}

/**
 * Save analytics to localStorage
 */
export function saveAnalyticsLocally(analytics: PresentationAnalytics): void {
  try {
    const key = `presentation-analytics-${analytics.presentationId}-${analytics.sessionId}`;
    localStorage.setItem(key, exportAnalytics(analytics));
  } catch (error) {
    console.error('Failed to save analytics locally:', error);
  }
}

/**
 * Load analytics from localStorage
 */
export function loadAnalyticsLocally(
  presentationId: string,
  sessionId: string
): PresentationAnalytics | null {
  try {
    const key = `presentation-analytics-${presentationId}-${sessionId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;

    return JSON.parse(data) as PresentationAnalytics;
  } catch (error) {
    console.error('Failed to load analytics locally:', error);
    return null;
  }
}
