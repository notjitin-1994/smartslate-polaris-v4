'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export interface PullToRefreshConfig {
  /**
   * Minimum distance to pull before refresh triggers
   * @default 80
   */
  threshold?: number;

  /**
   * Maximum pull distance before resistance kicks in
   * @default 120
   */
  maxPullDistance?: number;

  /**
   * Refresh duration in milliseconds
   * @default 1000
   */
  refreshDuration?: number;

  /**
   * Whether to enable haptic feedback
   * @default true
   */
  hapticFeedback?: boolean;

  /**
   * Element to attach pull-to-refresh to (defaults to window)
   */
  target?: Element | Window | null;
}

export interface PullToRefreshState {
  /**
   * Current pull distance in pixels
   */
  pullDistance: number;

  /**
   * Whether currently refreshing
   */
  isRefreshing: boolean;

  /**
   * Whether pull gesture is active
   */
  isPulling: boolean;

  /**
   * Whether pull threshold has been exceeded
   */
  canRefresh: boolean;
}

export interface PullToRefreshHandlers {
  /**
   * Callback fired when refresh is triggered
   */
  onRefresh?: () => Promise<void> | void;
}

/**
 * Custom hook for implementing pull-to-refresh functionality
 *
 * @example
 * ```tsx
 * function MyScrollableContent() {
 *   const { pullToRefreshProps, state } = usePullToRefresh({
 *     onRefresh: async () => {
 *       await fetchNewData()
 *     },
 *   })
 *
 *   return (
 *     <div {...pullToRefreshProps}>
 *       {state.isRefreshing ? (
 *         <RefreshIndicator />
 *       ) : (
 *         <ContentList />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function usePullToRefresh(config: PullToRefreshConfig & PullToRefreshHandlers = {}): {
  pullToRefreshProps: React.HTMLAttributes<HTMLDivElement>;
  state: PullToRefreshState;
} {
  const {
    threshold = 80,
    maxPullDistance = 120,
    refreshDuration = 1000,
    hapticFeedback = true,
    target = typeof window !== 'undefined' ? window : null,
    onRefresh,
  } = config;

  const haptic = useHapticFeedback({
    config: { enabled: hapticFeedback },
  });

  const [state, setState] = useState<PullToRefreshState>({
    pullDistance: 0,
    isRefreshing: false,
    isPulling: false,
    canRefresh: false,
  });

  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // Check if element is at top for pull-to-refresh to work
  const isAtTop = useCallback(() => {
    if (!scrollElementRef.current) return true;

    return scrollElementRef.current.scrollTop <= 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!isAtTop() || state.isRefreshing) return;

      const touch = event.touches[0];
      startYRef.current = touch.clientY;
      isDraggingRef.current = true;

      setState((prev) => ({
        ...prev,
        isPulling: true,
        pullDistance: 0,
      }));
    },
    [isAtTop, state.isRefreshing]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isDraggingRef.current || !isAtTop() || state.isRefreshing) return;

      const touch = event.touches[0];
      const currentY = touch.clientY;
      const pullDistance = Math.max(0, currentY - startYRef.current);

      if (pullDistance > 0) {
        // Apply resistance after max pull distance
        const limitedDistance = Math.min(pullDistance, maxPullDistance);
        const resistance = pullDistance > maxPullDistance ? 0.5 : 1;
        const finalDistance = limitedDistance * resistance;

        setState((prev) => ({
          ...prev,
          pullDistance: finalDistance,
          canRefresh: finalDistance >= threshold,
        }));

        // Prevent default scroll behavior
        event.preventDefault();
      }
    },
    [isAtTop, state.isRefreshing, threshold, maxPullDistance]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    async (event: TouchEvent) => {
      if (!isDraggingRef.current || !state.canRefresh) {
        // Reset state if not refreshing
        setState((prev) => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          canRefresh: false,
        }));
        isDraggingRef.current = false;
        return;
      }

      // Trigger refresh
      setState((prev) => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
      }));

      haptic.medium(); // Haptic feedback for refresh trigger

      try {
        await onRefresh?.();
      } finally {
        // Complete refresh after duration
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isRefreshing: false,
            pullDistance: 0,
            canRefresh: false,
          }));
        }, refreshDuration);

        isDraggingRef.current = false;
      }
    },
    [state.canRefresh, onRefresh, haptic, refreshDuration]
  );

  // Attach touch event listeners
  useEffect(() => {
    if (!target) return;

    const element = target === window ? document : target;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [target, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Props to apply to the scrollable container
  const pullToRefreshProps: React.HTMLAttributes<HTMLDivElement> = {
    ref: scrollElementRef,
    style: {
      transform: state.isPulling ? `translateY(${state.pullDistance}px)` : undefined,
      transition: state.isRefreshing ? 'transform 0.3s ease-out' : 'transform 0.1s ease-out',
    },
  };

  return {
    pullToRefreshProps,
    state,
  };
}
