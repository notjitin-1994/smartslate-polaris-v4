/**
 * PresentationMode - Main Container Component
 *
 * Orchestrates the entire presentation mode experience including
 * slide navigation, fullscreen management, keyboard shortcuts,
 * and state management.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Presentation,
  PresentationModeProps,
  PresentationState,
  NavigationDirection,
  PresentationSettings,
} from '@/types/presentation';
import { DEFAULT_PRESENTATION_SETTINGS } from '@/types/presentation';
import { SlideRenderer } from './SlideRenderer';

/**
 * Main PresentationMode Container Component
 */
export function PresentationMode({
  presentation,
  initialSlideIndex = 0,
  onExit,
  onSlideChange,
  onComplete,
  settings: userSettings,
  className,
}: PresentationModeProps): React.JSX.Element {
  // Merge user settings with defaults
  const settings: PresentationSettings = {
    ...DEFAULT_PRESENTATION_SETTINGS,
    ...userSettings,
  };

  // Presentation state
  const [state, setState] = useState<PresentationState>({
    currentSlideIndex: initialSlideIndex,
    totalSlides: presentation.slides.length,
    isFullscreen: false,
    isPlaying: false,
    showSpeakerNotes: false,
    showLaserPointer: false,
    laserPointerPosition: null,
    progress: 0,
    visitedSlides: new Set([initialSlideIndex]),
    startTime: new Date(),
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate progress percentage
  const calculateProgress = useCallback((slideIndex: number, totalSlides: number): number => {
    return totalSlides > 0 ? ((slideIndex + 1) / totalSlides) * 100 : 0;
  }, []);

  // Navigation handler
  const handleNavigate = useCallback(
    (direction: NavigationDirection, slideIndex?: number) => {
      setState((prev) => {
        let nextIndex = prev.currentSlideIndex;

        switch (direction) {
          case 'next':
            nextIndex = Math.min(prev.currentSlideIndex + 1, prev.totalSlides - 1);
            break;
          case 'previous':
            nextIndex = Math.max(prev.currentSlideIndex - 1, 0);
            break;
          case 'first':
            nextIndex = 0;
            break;
          case 'last':
            nextIndex = prev.totalSlides - 1;
            break;
          case 'goto':
            if (slideIndex !== undefined && slideIndex >= 0 && slideIndex < prev.totalSlides) {
              nextIndex = slideIndex;
            }
            break;
        }

        // Check if we reached the end
        if (nextIndex === prev.totalSlides - 1 && prev.currentSlideIndex !== nextIndex) {
          onComplete?.();
        }

        // Trigger slide change callback
        if (nextIndex !== prev.currentSlideIndex) {
          onSlideChange?.(nextIndex);
        }

        const newVisited = new Set(prev.visitedSlides);
        newVisited.add(nextIndex);

        return {
          ...prev,
          currentSlideIndex: nextIndex,
          progress: calculateProgress(nextIndex, prev.totalSlides),
          visitedSlides: newVisited,
        };
      });
    },
    [calculateProgress, onSlideChange, onComplete]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!settings.navigation.enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Next slide
      if (settings.shortcuts.nextSlide.includes(key)) {
        e.preventDefault();
        handleNavigate('next');
      }
      // Previous slide
      else if (settings.shortcuts.previousSlide.includes(key)) {
        e.preventDefault();
        handleNavigate('previous');
      }
      // First slide
      else if (settings.shortcuts.firstSlide.includes(key)) {
        e.preventDefault();
        handleNavigate('first');
      }
      // Last slide
      else if (settings.shortcuts.lastSlide.includes(key)) {
        e.preventDefault();
        handleNavigate('last');
      }
      // Exit presentation
      else if (settings.shortcuts.exitPresentation.includes(key)) {
        e.preventDefault();
        onExit?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, handleNavigate, onExit]);

  // Fullscreen management
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setState((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setState((prev) => ({ ...prev, isFullscreen: false }));
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`presentation-mode bg-background-dark fixed inset-0 z-50 overflow-hidden ${className || ''}`}
      data-presentation-id={presentation.id}
    >
      {/* Slides Container with proper 16:9 aspect ratio and aesthetic padding */}
      <div className="slides-container absolute inset-0 flex items-center justify-center px-12 py-8 md:px-20 lg:px-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentSlideIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="slide-wrapper relative shadow-2xl"
            style={{
              // 16:9 aspect ratio with increased padding to prevent edge bleeding
              // Using 85% of available space to ensure adequate margins
              width: 'min(85vw, calc((100vh - 160px) * 16 / 9))',
              height: 'min(calc(85vw * 9 / 16), calc(100vh - 160px))',
              maxWidth: '1400px', // Reduced max width for better margins
              maxHeight: '787.5px', // Maintain 16:9 ratio (1400 * 9/16)
            }}
          >
            <div className="slide-content bg-background-primary/95 absolute inset-0 overflow-auto rounded-xl backdrop-blur-sm">
              <SlideRenderer slide={presentation.slides[state.currentSlideIndex]} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar - Placeholder */}
      {settings.showProgressBar && (
        <div className="fixed right-0 bottom-0 left-0 h-1 bg-white/10">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}

      {/* Slide Number - Placeholder */}
      {settings.showSlideNumbers && (
        <div className="text-text-secondary fixed right-4 bottom-4 text-sm">
          {state.currentSlideIndex + 1} / {state.totalSlides}
        </div>
      )}
    </div>
  );
}

export default PresentationMode;
