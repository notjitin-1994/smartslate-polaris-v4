'use client';

import { useMemo } from 'react';
import type { SpeakerNotes, SlideContent } from '@/types/presentation';

interface UseSpeakerNotesOptions {
  slides: SlideContent[];
  currentSlideIndex: number;
}

interface UseSpeakerNotesReturn {
  currentNotes: SpeakerNotes | null;
  nextSlide: SlideContent | null;
  hasNotes: boolean;
  estimatedTime: number;
  actualTime?: number;
}

/**
 * Speaker notes management hook
 * Provides access to current slide notes and next slide preview
 */
export function useSpeakerNotes({
  slides,
  currentSlideIndex,
}: UseSpeakerNotesOptions): UseSpeakerNotesReturn {
  const currentSlide = slides[currentSlideIndex];
  const nextSlide = currentSlideIndex < slides.length - 1 ? slides[currentSlideIndex + 1] : null;

  const currentNotes = useMemo<SpeakerNotes | null>(() => {
    if (!currentSlide?.speakerNotes) return null;

    return {
      slideId: currentSlide.id,
      notes: currentSlide.speakerNotes,
      tips: [], // Can be extended with tips from metadata
      timing: {
        estimated: currentSlide.duration || 0,
      },
      nextSlidePreview: true,
    };
  }, [currentSlide]);

  const hasNotes = !!currentSlide?.speakerNotes;
  const estimatedTime = currentSlide?.duration || 0;

  return {
    currentNotes,
    nextSlide,
    hasNotes,
    estimatedTime,
  };
}
