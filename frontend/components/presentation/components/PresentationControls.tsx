/**
 * PresentationControls - Navigation and Control Toolbar
 *
 * Provides navigation controls, fullscreen toggle, speaker notes,
 * laser pointer, and other presentation control functions.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize,
  Minimize,
  FileText,
  Pointer,
  Play,
  Pause,
  X,
} from 'lucide-react';
import type { PresentationControlsProps } from '@/types/presentation';

/**
 * Presentation Controls Component
 */
export function PresentationControls({
  state,
  onNavigate,
  onToggleFullscreen,
  onToggleSpeakerNotes,
  onToggleLaserPointer,
  onTogglePlay,
  onExit,
  className,
}: PresentationControlsProps): React.JSX.Element {
  const {
    currentSlideIndex,
    totalSlides,
    isFullscreen,
    showSpeakerNotes,
    showLaserPointer,
    isPlaying,
  } = state;

  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === totalSlides - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 ${className || ''}`}
      >
        <div className="glass-card flex items-center gap-2 p-3">
          {/* Exit Button */}
          <button
            onClick={onExit}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Exit presentation"
            title="Exit (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-white/20" />

          {/* First Slide */}
          <button
            onClick={() => onNavigate('first')}
            disabled={isFirstSlide}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="First slide"
            title="First Slide (Home)"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>

          {/* Previous Slide */}
          <button
            onClick={() => onNavigate('previous')}
            disabled={isFirstSlide}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Previous slide"
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Slide Counter */}
          <div className="flex min-w-[80px] items-center justify-center gap-1 px-3">
            <span className="text-sm font-medium text-white">{currentSlideIndex + 1}</span>
            <span className="text-sm text-white/50">/</span>
            <span className="text-sm text-white/70">{totalSlides}</span>
          </div>

          {/* Next Slide */}
          <button
            onClick={() => onNavigate('next')}
            disabled={isLastSlide}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Next slide"
            title="Next Slide (Right Arrow)"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Last Slide */}
          <button
            onClick={() => onNavigate('last')}
            disabled={isLastSlide}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Last slide"
            title="Last Slide (End)"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-white/20" />

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              isPlaying
                ? 'bg-primary text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (P)' : 'Play (P)'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          {/* Speaker Notes */}
          <button
            onClick={onToggleSpeakerNotes}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              showSpeakerNotes
                ? 'bg-primary text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            aria-label="Toggle speaker notes"
            title="Speaker Notes (S)"
          >
            <FileText className="h-5 w-5" />
          </button>

          {/* Laser Pointer */}
          <button
            onClick={onToggleLaserPointer}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              showLaserPointer
                ? 'bg-primary text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            aria-label="Toggle laser pointer"
            title="Laser Pointer (L)"
          >
            <Pointer className="h-5 w-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PresentationControls;
