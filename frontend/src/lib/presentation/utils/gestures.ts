import type { SwipeGesture } from '@/types/presentation';

/**
 * Touch gesture detection utilities
 */

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * Calculate swipe gesture from touch points
 */
export function calculateSwipeGesture(start: TouchPoint, end: TouchPoint): SwipeGesture | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const deltaTime = end.time - start.time;

  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const velocity = distance / deltaTime; // pixels per millisecond

  // Minimum thresholds
  const minDistance = 50; // pixels
  const minVelocity = 0.3; // pixels per millisecond

  if (distance < minDistance || velocity < minVelocity) {
    return null;
  }

  // Determine primary direction
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const isHorizontal = absX > absY;

  let direction: SwipeGesture['direction'];
  if (isHorizontal) {
    direction = deltaX > 0 ? 'right' : 'left';
  } else {
    direction = deltaY > 0 ? 'down' : 'up';
  }

  return {
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    direction,
    distance,
    velocity,
  };
}

/**
 * Check if swipe is horizontal
 */
export function isHorizontalSwipe(gesture: SwipeGesture): boolean {
  return gesture.direction === 'left' || gesture.direction === 'right';
}

/**
 * Check if swipe is vertical
 */
export function isVerticalSwipe(gesture: SwipeGesture): boolean {
  return gesture.direction === 'up' || gesture.direction === 'down';
}

/**
 * Detect pinch gesture (for zooming)
 */
export function detectPinch(
  touch1Start: TouchPoint,
  touch1End: TouchPoint,
  touch2Start: TouchPoint,
  touch2End: TouchPoint
): { scale: number; center: { x: number; y: number } } | null {
  const startDistance = Math.sqrt(
    Math.pow(touch2Start.x - touch1Start.x, 2) + Math.pow(touch2Start.y - touch1Start.y, 2)
  );

  const endDistance = Math.sqrt(
    Math.pow(touch2End.x - touch1End.x, 2) + Math.pow(touch2End.y - touch1End.y, 2)
  );

  const scale = endDistance / startDistance;

  const centerX = (touch1End.x + touch2End.x) / 2;
  const centerY = (touch1End.y + touch2End.y) / 2;

  return {
    scale,
    center: { x: centerX, y: centerY },
  };
}

/**
 * Throttle touch events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Debounce touch events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
