'use client';

import { useState, useCallback, useRef } from 'react';
import type { SwipeGesture } from '@/types/presentation';

interface UseSlideNavigationOptions {
  totalSlides: number;
  currentSlide: number;
  enableSwipe?: boolean;
  enableWheel?: boolean;
  loop?: boolean;
  onNavigate: (direction: 'next' | 'previous') => void;
}

interface UseSlideNavigationReturn {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleWheel: (e: React.WheelEvent) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Slide navigation hook with touch gesture and wheel support
 */
export function useSlideNavigation({
  totalSlides,
  currentSlide,
  enableSwipe = true,
  enableWheel = true,
  loop = false,
  onNavigate,
}: UseSlideNavigationOptions): UseSlideNavigationReturn {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWheelRef = useRef<number>(0);

  const canGoNext = loop || currentSlide < totalSlides - 1;
  const canGoPrevious = loop || currentSlide > 0;

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enableSwipe) return;

      const touch = e.touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      });
    },
    [enableSwipe]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while swiping
    // e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enableSwipe || !touchStart) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - touchStart.x;
      const deltaY = endY - touchStart.y;
      const deltaTime = endTime - touchStart.time;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Determine swipe direction (horizontal swipes only)
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const minSwipeDistance = 50; // pixels
      const minVelocity = 0.3; // pixels per millisecond

      if (isHorizontalSwipe && distance >= minSwipeDistance && velocity >= minVelocity) {
        if (deltaX > 0 && canGoPrevious) {
          // Swipe right - go to previous slide
          onNavigate('previous');
        } else if (deltaX < 0 && canGoNext) {
          // Swipe left - go to next slide
          onNavigate('next');
        }
      }

      setTouchStart(null);
    },
    [enableSwipe, touchStart, canGoNext, canGoPrevious, onNavigate]
  );

  // Wheel handler for mouse wheel navigation
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enableWheel) return;

      const now = Date.now();
      const timeSinceLastWheel = now - lastWheelRef.current;

      // Debounce wheel events (300ms)
      if (timeSinceLastWheel < 300) return;

      // Clear existing timeout
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      // Set new timeout to update last wheel time
      wheelTimeoutRef.current = setTimeout(() => {
        lastWheelRef.current = now;
      }, 50);

      // Determine direction
      if (e.deltaY > 0 && canGoNext) {
        onNavigate('next');
      } else if (e.deltaY < 0 && canGoPrevious) {
        onNavigate('previous');
      }
    },
    [enableWheel, canGoNext, canGoPrevious, onNavigate]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    canGoNext,
    canGoPrevious,
  };
}
