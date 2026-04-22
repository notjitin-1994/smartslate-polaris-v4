'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SwipeGestureConfig {
  /**
   * Minimum distance in pixels to trigger a swipe gesture
   * @default 100
   */
  threshold?: number;

  /**
   * Minimum velocity required to trigger gesture (pixels/ms)
   * @default 0.5
   */
  velocityThreshold?: number;

  /**
   * Maximum time in milliseconds for a valid swipe gesture
   * @default 500
   */
  maxDuration?: number;

  /**
   * Whether to prevent default touch behaviors during gesture
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Whether to enable rubber band effect at boundaries
   * @default true
   */
  enableRubberBand?: boolean;
}

export interface SwipeGestureState {
  /**
   * Current drag offset from start position (pixels)
   */
  offset: number;

  /**
   * Current velocity of the drag (pixels/ms)
   */
  velocity: number;

  /**
   * Whether a gesture is currently in progress
   */
  isDragging: boolean;

  /**
   * Whether the gesture has exceeded the threshold
   */
  hasExceededThreshold: boolean;

  /**
   * Direction of the swipe gesture
   */
  direction: 'left' | 'right' | 'up' | 'down' | null;

  /**
   * Distance traveled since gesture started
   */
  distance: number;
}

export interface SwipeGestureHandlers {
  /**
   * Called when a swipe gesture starts
   */
  onSwipeStart?: (state: SwipeGestureState) => void;

  /**
   * Called continuously during a swipe gesture
   */
  onSwipeMove?: (state: SwipeGestureState) => void;

  /**
   * Called when a swipe gesture ends
   */
  onSwipeEnd?: (state: SwipeGestureState) => void;

  /**
   * Called when a swipe gesture is completed (threshold exceeded)
   */
  onSwipeComplete?: (state: SwipeGestureState) => void;

  /**
   * Called when a swipe gesture is cancelled
   */
  onSwipeCancel?: (state: SwipeGestureState) => void;
}

export interface UseSwipeGestureOptions {
  /**
   * Configuration for the swipe gesture behavior
   */
  config?: SwipeGestureConfig;

  /**
   * Event handlers for different phases of the gesture
   */
  handlers?: SwipeGestureHandlers;

  /**
   * Element to attach gesture listeners to
   */
  element?: HTMLElement | null;

  /**
   * Whether the hook is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Custom hook for handling swipe gestures with drag tracking and velocity calculation
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { gestureState, gestureHandlers } = useSwipeGesture({
 *     config: {
 *       threshold: 100,
 *       velocityThreshold: 0.5,
 *     },
 *     handlers: {
 *       onSwipeComplete: (state) => {
 *         if (state.direction === 'left') {
 *           closeMenu()
 *         }
 *       },
 *     },
 *   })
 *
 *   return (
 *     <div {...gestureHandlers}>
 *       <div style={{ transform: `translateX(${gestureState.offset}px)` }}>
 *         Content
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSwipeGesture(options: UseSwipeGestureOptions = {}) {
  const { config = {}, handlers = {}, element, enabled = true } = options;

  const {
    threshold = 100,
    velocityThreshold = 0.5,
    maxDuration = 500,
    preventDefault = true,
    enableRubberBand = true,
  } = config;

  const elementRef = useRef<HTMLElement | null>(element || null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef<{ x: number; y: number }>([0, 0]);

  const [gestureState, setGestureState] = useState<SwipeGestureState>({
    offset: 0,
    velocity: 0,
    isDragging: false,
    hasExceededThreshold: false,
    direction: null,
    distance: 0,
  });

  // Update element ref when element prop changes
  useEffect(() => {
    if (element) {
      elementRef.current = element;
    }
  }, [element]);

  const calculateVelocity = useCallback(
    (
      currentPos: { x: number; y: number },
      lastPos: { x: number; y: number },
      timeDelta: number
    ) => {
      if (timeDelta === 0) return { x: 0, y: 0 };

      const deltaX = currentPos.x - lastPos.x;
      const deltaY = currentPos.y - lastPos.y;

      return {
        x: deltaX / timeDelta,
        y: deltaY / timeDelta,
      };
    },
    []
  );

  const calculateDirection = useCallback(
    (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => {
      const deltaX = currentPos.x - startPos.x;
      const deltaY = currentPos.y - startPos.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    },
    []
  );

  const calculateDistance = useCallback(
    (startPos: { x: number; y: number }, currentPos: { x: number; y: number }) => {
      const deltaX = currentPos.x - startPos.x;
      const deltaY = currentPos.y - startPos.y;
      return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    },
    []
  );

  const applyRubberBandEffect = useCallback(
    (offset: number, maxOffset: number) => {
      if (!enableRubberBand) return offset;

      if (offset > maxOffset) {
        const excess = offset - maxOffset;
        return maxOffset + excess * 0.5; // Reduce resistance for smoother feel
      } else if (offset < -maxOffset) {
        const excess = Math.abs(offset) - maxOffset;
        return -maxOffset - excess * 0.5;
      }

      return offset;
    },
    [enableRubberBand]
  );

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      const startPos = { x: touch.clientX, y: touch.clientY };

      startPosRef.current = startPos;
      startTimeRef.current = Date.now();
      lastPosRef.current = startPos;

      setGestureState({
        offset: 0,
        velocity: 0,
        isDragging: true,
        hasExceededThreshold: false,
        direction: null,
        distance: 0,
      });

      handlers.onSwipeStart?.({
        offset: 0,
        velocity: 0,
        isDragging: true,
        hasExceededThreshold: false,
        direction: null,
        distance: 0,
      });

      if (preventDefault) {
        event.preventDefault();
      }
    },
    [enabled, handlers, preventDefault]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !startPosRef.current || !lastPosRef.current) return;

      const touch = event.touches[0];
      const currentPos = { x: touch.clientX, y: touch.clientY };
      const now = Date.now();
      const timeDelta = now - startTimeRef.current;

      if (timeDelta > maxDuration) {
        handleTouchEnd(event);
        return;
      }

      // Calculate velocity based on last position
      const velocity = calculateVelocity(currentPos, lastPosRef.current, timeDelta || 1);
      velocityRef.current = velocity;

      // Calculate direction and distance
      const direction = calculateDirection(startPosRef.current, currentPos);
      const distance = calculateDistance(startPosRef.current, currentPos);

      // Calculate offset (simplified for horizontal movement)
      const offset = currentPos.x - startPosRef.current.x;
      const hasExceededThreshold =
        Math.abs(offset) > threshold || Math.abs(velocity.x) > velocityThreshold;

      // Apply rubber band effect if enabled
      const finalOffset = applyRubberBandEffect(offset, threshold * 2);

      setGestureState({
        offset: finalOffset,
        velocity: Math.abs(velocity.x),
        isDragging: true,
        hasExceededThreshold,
        direction,
        distance,
      });

      handlers.onSwipeMove?.({
        offset: finalOffset,
        velocity: Math.abs(velocity.x),
        isDragging: true,
        hasExceededThreshold,
        direction,
        distance,
      });

      lastPosRef.current = currentPos;

      if (preventDefault) {
        event.preventDefault();
      }
    },
    [
      enabled,
      threshold,
      velocityThreshold,
      maxDuration,
      calculateVelocity,
      calculateDirection,
      calculateDistance,
      applyRubberBandEffect,
      handlers,
      preventDefault,
    ]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !startPosRef.current) return;

      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;

      const finalState: SwipeGestureState = {
        offset: 0, // Reset offset on gesture end
        velocity: Math.abs(velocityRef.current.x),
        isDragging: false,
        hasExceededThreshold: gestureState.hasExceededThreshold,
        direction: gestureState.direction,
        distance: gestureState.distance,
      };

      // Determine if gesture should complete based on threshold and velocity
      const shouldComplete =
        gestureState.hasExceededThreshold || Math.abs(velocityRef.current.x) > velocityThreshold;

      if (shouldComplete) {
        handlers.onSwipeComplete?.(finalState);
      } else {
        handlers.onSwipeCancel?.(finalState);
      }

      handlers.onSwipeEnd?.(finalState);

      // Reset state
      setGestureState({
        offset: 0,
        velocity: 0,
        isDragging: false,
        hasExceededThreshold: false,
        direction: null,
        distance: 0,
      });

      startPosRef.current = null;
      lastPosRef.current = null;
      velocityRef.current = { x: 0, y: 0 };

      if (preventDefault) {
        event.preventDefault();
      }
    },
    [enabled, velocityThreshold, gestureState, handlers, preventDefault]
  );

  // Attach event listeners
  useEffect(() => {
    const targetElement = elementRef.current;
    if (!targetElement || !enabled) return;

    targetElement.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    targetElement.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    gestureState,
    gestureHandlers,
    isSupported: typeof window !== 'undefined' && 'ontouchstart' in window,
  };
}
