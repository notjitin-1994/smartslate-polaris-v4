/**
 * SpeakerNotes - Speaker Notes Display Component
 *
 * Shows speaker notes for the current slide with optional
 * next slide preview and timing information.
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronRight, Lightbulb } from 'lucide-react';
import type { SpeakerNotesProps } from '@/types/presentation';

/**
 * Speaker Notes Component
 */
export function SpeakerNotes({
  notes,
  isVisible,
  nextSlide,
  onClose,
  className,
}: SpeakerNotesProps): React.JSX.Element | null {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed top-0 right-0 z-40 h-full w-full max-w-md ${className || ''}`}
      >
        {/* Glass Background */}
        <div className="glass-card h-full overflow-hidden">
          {/* Header */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-heading text-primary font-semibold">Speaker Notes</h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Close speaker notes"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
            {notes ? (
              <div className="space-y-6">
                {/* Timing Information */}
                {notes.timing && (
                  <div className="glass-shell space-y-2 p-4">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Clock className="h-4 w-4" />
                      <span>Timing</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div>
                        <div className="text-caption text-text-secondary">Estimated</div>
                        <div className="text-body text-primary font-medium">
                          {Math.round(notes.timing.estimated / 1000)}s
                        </div>
                      </div>
                      {notes.timing.actual && (
                        <div>
                          <div className="text-caption text-text-secondary">Actual</div>
                          <div className="text-body text-primary font-medium">
                            {Math.round(notes.timing.actual / 1000)}s
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Notes */}
                {notes.notes && (
                  <div className="space-y-2">
                    <h4 className="text-body text-primary font-medium">Notes</h4>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {notes.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tips */}
                {notes.tips && notes.tips.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="text-primary h-4 w-4" />
                      <h4 className="text-body text-primary font-medium">Tips</h4>
                    </div>
                    <ul className="space-y-2">
                      {notes.tips.map((tip, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-primary mt-1 flex-shrink-0">•</span>
                          <span className="text-body text-text-secondary">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Slide Preview */}
                {notes.nextSlidePreview && nextSlide && (
                  <div className="glass-shell space-y-2 p-4">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <ChevronRight className="h-4 w-4" />
                      <span>Next Slide</span>
                    </div>
                    <div className="text-body text-primary font-medium">{nextSlide.title}</div>
                    {nextSlide.subtitle && (
                      <div className="text-caption text-text-secondary">{nextSlide.subtitle}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-2 text-4xl opacity-50">📝</div>
                  <p className="text-body text-text-secondary">No notes for this slide</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpeakerNotes;
