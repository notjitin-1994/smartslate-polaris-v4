'use client';

import React from 'react';
import { ProgressTrackerProps } from '@/lib/dynamic-form';
import { cn } from '@/lib/utils';

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  totalSections,
  completedSections,
  currentSection,
  className,
  showPercentage = true,
  showSections = true,
}) => {
  const progressPercentage =
    totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-secondary text-sm font-medium">Progress</h3>
          {showPercentage && (
            <span className="text-primary text-sm font-medium">{progressPercentage}%</span>
          )}
        </div>

        <div className="h-2 w-full rounded-full bg-white/5 shadow-inner">
          <div
            className="bg-primary relative h-2 rounded-full transition-all duration-700 ease-out"
            // One-off: Dynamic width for real-time progress indicator
            style={{
              width: `${progressPercentage}%`,
              boxShadow:
                '0 0 16px rgba(167, 218, 219, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Form progress: ${progressPercentage}% complete`}
          >
            {/* Animated shimmer effect */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* Section progress */}
      {showSections && (
        <div className="space-y-2">
          <h4 className="text-secondary text-sm font-medium">Sections</h4>
          <div className="flex space-x-2">
            {Array.from({ length: totalSections }, (_, index) => {
              const sectionNumber = index + 1;
              const isCompleted = sectionNumber <= completedSections;
              const isCurrent = sectionNumber === currentSection;
              const _isUpcoming =
                sectionNumber > completedSections && sectionNumber !== currentSection;

              return (
                <div
                  key={index}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-all duration-300',
                    isCompleted
                      ? 'bg-primary-accent shadow-[0_0_8px_rgba(167,218,219,0.6)]'
                      : isCurrent
                        ? 'bg-secondary-accent shadow-[0_0_8px_rgba(79,70,229,0.5)]'
                        : 'bg-white/5'
                  )}
                  title={`Section ${sectionNumber}${isCompleted ? ' (Completed)' : isCurrent ? ' (Current)' : ' (Upcoming)'}`}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Completed: {completedSections}</span>
            <span>Total: {totalSections}</span>
          </div>
        </div>
      )}

      {/* Progress milestones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Milestones</span>
          <span className="text-primary font-medium">
            {completedSections} / {totalSections} sections
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { threshold: 25, label: '25%', icon: '🌱' },
            { threshold: 50, label: '50%', icon: '🌿' },
            { threshold: 75, label: '75%', icon: '🌳' },
            { threshold: 100, label: '100%', icon: '🎉' },
          ].map(({ threshold, label, icon }) => {
            const isReached = progressPercentage >= threshold;
            const isCurrent =
              progressPercentage >= threshold - 25 && progressPercentage < threshold;

            return (
              <div
                key={threshold}
                className={cn(
                  'rounded-lg p-2 text-center transition-all duration-300',
                  isReached
                    ? 'bg-primary-accent/10 text-primary-accent border-primary-accent/30 border shadow-[0_0_8px_rgba(167,218,219,0.3)]'
                    : isCurrent
                      ? 'bg-secondary-accent/10 text-secondary-accent border-secondary-accent/30 border'
                      : 'text-text-disabled border border-white/10 bg-white/5'
                )}
              >
                <div className="text-lg">{icon}</div>
                <div className="text-xs font-medium">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion message */}
      {progressPercentage === 100 && (
        <div className="border-primary-accent/30 bg-primary-accent/10 rounded-lg border p-3 shadow-[0_0_12px_rgba(167,218,219,0.3)]">
          <div className="flex items-center">
            <div className="text-primary-accent mr-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-primary-accent text-sm font-medium">
              All sections completed! Ready to submit.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
