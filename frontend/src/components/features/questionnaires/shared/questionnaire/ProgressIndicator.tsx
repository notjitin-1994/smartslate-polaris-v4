'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuestionnaire } from './QuestionnaireProvider';
import { useResponsive } from '@/lib/design-system/hooks/useResponsive';

interface ProgressIndicatorProps {
  variant?: 'stepper' | 'bar' | 'compact';
  showLabels?: boolean;
  allowNavigation?: boolean;
  className?: string;
}

export function ProgressIndicator({
  variant = 'stepper',
  showLabels = true,
  allowNavigation = true,
  className,
}: ProgressIndicatorProps) {
  const {
    sections,
    currentSection,
    goToSection,
    canNavigateToSection,
    completionPercentage,
    sectionCompletionStatus,
  } = useQuestionnaire();

  const { isMobile } = useResponsive();

  // Compact variant for mobile
  if (variant === 'compact' || (isMobile && variant === 'stepper')) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {/* Text Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">
            Section {currentSection + 1} of {sections.length}
          </span>
          <span className="font-medium text-cyan-500">{completionPercentage}% Complete</span>
        </div>
      </div>
    );
  }

  // Bar variant
  if (variant === 'bar') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">{sections[currentSection].title}</h3>
          <span className="text-sm text-white/70">{completionPercentage}% Complete</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg"
            style={{
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {sections[currentSection].description && (
          <p className="text-sm text-white/60">{sections[currentSection].description}</p>
        )}
      </div>
    );
  }

  // Stepper variant (default)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        {/* Progress Line */}
        <div className="progress-stepper">
          {sections.map((section, index) => {
            const isCompleted = sectionCompletionStatus[index];
            const isCurrent = index === currentSection;
            const canNavigate = canNavigateToSection(index);

            return (
              <motion.button
                key={section.id}
                type="button"
                onClick={() => allowNavigation && canNavigate && goToSection(index)}
                disabled={!allowNavigation || !canNavigate}
                className={cn(
                  'progress-step',
                  isCompleted && 'completed',
                  isCurrent && 'current',
                  !canNavigate && 'cursor-not-allowed opacity-50'
                )}
                whileHover={canNavigate ? { scale: 1.1 } : {}}
                whileTap={canNavigate ? { scale: 0.95 } : {}}
                aria-label={`Go to section ${index + 1}: ${section.title}`}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Progress Line Fill */}
        <motion.div
          className="absolute top-1/2 left-0 z-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-teal-500"
          initial={{ width: 0 }}
          animate={{
            width: `${(currentSection / (sections.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Section Labels */}
      {showLabels && !isMobile && (
        <div className="flex justify-between">
          {sections.map((section, index) => {
            const isCurrent = index === currentSection;
            const canNavigate = canNavigateToSection(index);

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => allowNavigation && canNavigate && goToSection(index)}
                disabled={!allowNavigation || !canNavigate}
                className={cn(
                  'text-xs transition-all',
                  isCurrent
                    ? 'font-semibold text-cyan-500'
                    : canNavigate
                      ? 'text-white/60 hover:text-white/80'
                      : 'cursor-not-allowed text-white/30'
                )}
              >
                {section.title.length > 15 ? `${section.title.substring(0, 15)}...` : section.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Current Section Info */}
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-light rounded-lg p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
            <span className="text-xs font-medium tracking-wide text-cyan-500 uppercase">
              Section {currentSection + 1} of {sections.length}
            </span>
          </div>
          <span className="text-xs text-white/60">{completionPercentage}% Overall</span>
        </div>
        <h3 className="text-xl font-semibold text-white">{sections[currentSection].title}</h3>
        {sections[currentSection].description && (
          <p className="mt-1 text-sm text-white/60">{sections[currentSection].description}</p>
        )}
      </motion.div>
    </div>
  );
}
