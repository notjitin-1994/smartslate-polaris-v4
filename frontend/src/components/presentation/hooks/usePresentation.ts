'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  PresentationState,
  NavigationDirection,
  Presentation,
  PresentationSettings,
  SlideTransitionCallback,
} from '@/types/presentation';
import { DEFAULT_PRESENTATION_SETTINGS } from '@/types/presentation';

interface UsePresentationOptions {
  presentation: Presentation;
  initialSlideIndex?: number;
  onSlideChange?: (slideIndex: number) => void;
  onComplete?: () => void;
  settings?: Partial<PresentationSettings>;
}

interface UsePresentationReturn {
  state: PresentationState;
  navigate: (direction: NavigationDirection, slideIndex?: number) => void;
  toggleFullscreen: () => void;
  toggleSpeakerNotes: () => void;
  toggleLaserPointer: () => void;
  togglePlay: () => void;
  updateLaserPosition: (x: number, y: number) => void;
  reset: () => void;
}

/**
 * Main presentation state management hook
 * Handles navigation, playback, and presentation state
 */
export function usePresentation({
  presentation,
  initialSlideIndex = 0,
  onSlideChange,
  onComplete,
  settings: userSettings,
}: UsePresentationOptions): UsePresentationReturn {
  const settings = { ...DEFAULT_PRESENTATION_SETTINGS, ...userSettings };
  const totalSlides = presentation.slides.length;

  const [state, setState] = useState<PresentationState>({
    currentSlideIndex: initialSlideIndex,
    totalSlides,
    isFullscreen: false,
    isPlaying: false,
    showSpeakerNotes: false,
    showLaserPointer: false,
    laserPointerPosition: null,
    progress: (initialSlideIndex / totalSlides) * 100,
    visitedSlides: new Set([initialSlideIndex]),
    startTime: new Date(),
    elapsedTime: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time
  useEffect(() => {
    if (state.isPlaying) {
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedTime: Date.now() - (prev.startTime?.getTime() || 0),
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isPlaying]);

  // Auto-advance logic
  useEffect(() => {
    if (state.isPlaying && settings.navigation.autoAdvance) {
      const currentSlide = presentation.slides[state.currentSlideIndex];
      const delay = currentSlide?.duration || settings.navigation.autoAdvanceDelay || 5000;

      autoAdvanceRef.current = setTimeout(() => {
        navigate('next');
      }, delay);
    }

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, [state.currentSlideIndex, state.isPlaying, settings.navigation.autoAdvance]);

  // Navigate between slides
  const navigate = useCallback(
    (direction: NavigationDirection, slideIndex?: number) => {
      let nextIndex = state.currentSlideIndex;

      switch (direction) {
        case 'next':
          nextIndex = Math.min(state.currentSlideIndex + 1, totalSlides - 1);
          break;
        case 'previous':
          nextIndex = Math.max(state.currentSlideIndex - 1, 0);
          break;
        case 'first':
          nextIndex = 0;
          break;
        case 'last':
          nextIndex = totalSlides - 1;
          break;
        case 'goto':
          if (slideIndex !== undefined && slideIndex >= 0 && slideIndex < totalSlides) {
            nextIndex = slideIndex;
          }
          break;
      }

      // Handle looping
      if (settings.navigation.loop) {
        if (direction === 'next' && state.currentSlideIndex === totalSlides - 1) {
          nextIndex = 0;
        } else if (direction === 'previous' && state.currentSlideIndex === 0) {
          nextIndex = totalSlides - 1;
        }
      }

      // Check if we've reached the end
      if (nextIndex === totalSlides - 1 && state.currentSlideIndex !== totalSlides - 1) {
        onComplete?.();
      }

      // Update state
      setState((prev) => {
        const newVisitedSlides = new Set(prev.visitedSlides);
        newVisitedSlides.add(nextIndex);

        return {
          ...prev,
          currentSlideIndex: nextIndex,
          progress: ((nextIndex + 1) / totalSlides) * 100,
          visitedSlides: newVisitedSlides,
        };
      });

      onSlideChange?.(nextIndex);
    },
    [state.currentSlideIndex, totalSlides, settings.navigation.loop, onSlideChange, onComplete]
  );

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setState((prev) => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  // Toggle speaker notes
  const toggleSpeakerNotes = useCallback(() => {
    setState((prev) => ({ ...prev, showSpeakerNotes: !prev.showSpeakerNotes }));
  }, []);

  // Toggle laser pointer
  const toggleLaserPointer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showLaserPointer: !prev.showLaserPointer,
      laserPointerPosition: !prev.showLaserPointer ? null : prev.laserPointerPosition,
    }));
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Update laser pointer position
  const updateLaserPosition = useCallback((x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      laserPointerPosition: prev.showLaserPointer ? { x, y } : null,
    }));
  }, []);

  // Reset presentation
  const reset = useCallback(() => {
    setState({
      currentSlideIndex: 0,
      totalSlides,
      isFullscreen: false,
      isPlaying: false,
      showSpeakerNotes: false,
      showLaserPointer: false,
      laserPointerPosition: null,
      progress: 0,
      visitedSlides: new Set([0]),
      startTime: new Date(),
      elapsedTime: 0,
    });
  }, [totalSlides]);

  return {
    state,
    navigate,
    toggleFullscreen,
    toggleSpeakerNotes,
    toggleLaserPointer,
    togglePlay,
    updateLaserPosition,
    reset,
  };
}
