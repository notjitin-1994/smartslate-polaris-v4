'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuestionnaire } from './QuestionnaireProvider';

interface NavigationControlsProps {
  className?: string;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function NavigationControls({
  className,
  showSkip = false,
  onSkip,
}: NavigationControlsProps) {
  const {
    isFirstSection,
    isLastSection,
    goToNextSection,
    goToPreviousSection,
    submitQuestionnaire,
    isSubmitting,
    validateSection,
    currentSection,
  } = useQuestionnaire();

  const handleNext = async () => {
    const isValid = await validateSection(currentSection);
    if (isValid) {
      goToNextSection();
    }
  };

  const handleSubmit = async () => {
    await submitQuestionnaire();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex items-center justify-between gap-4 p-6', className)}
    >
      {/* Left Side - Previous Button */}
      <div className="flex-1">
        {!isFirstSection && (
          <motion.button
            type="button"
            onClick={goToPreviousSection}
            disabled={isSubmitting}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 shadow-lg backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={{ scale: 1.03, x: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Previous</span>
          </motion.button>
        )}
      </div>

      {/* Right Side - Skip & Next/Submit */}
      <div className="flex items-center gap-3">
        {/* Skip Button */}
        {showSkip && !isLastSection && onSkip && (
          <motion.button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Skip Section
          </motion.button>
        )}

        {/* Next/Submit Button */}
        {!isLastSection ? (
          <motion.button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:shadow-xl hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative">Next Section</span>
            <svg
              className="relative h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
            {isSubmitting ? (
              <>
                <div className="relative mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="relative">Processing...</span>
              </>
            ) : (
              <>
                <span className="relative">Complete Questionnaire</span>
                <svg
                  className="relative h-5 w-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
