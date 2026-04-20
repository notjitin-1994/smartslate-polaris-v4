'use client';

import React from 'react';
import { wizardSteps } from '@/components/wizard/static-questions/types';

type ProgressProps = {
  currentIndex: number;
  onSelect?: (index: number) => void;
};

export function ProgressIndicator({ currentIndex, onSelect }: ProgressProps): React.JSX.Element {
  const percent = Math.round(((currentIndex + 1) / wizardSteps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Step {currentIndex + 1} of {wizardSteps.length}
          </div>
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {percent}% complete
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 shadow-inner">
          <div
            className="bg-primary relative h-2 rounded-full transition-all duration-700 ease-out"
            // One-off: Dynamic width for wizard step progress indicator
            style={{
              width: `${percent}%`,
              boxShadow:
                '0 0 16px rgba(167, 218, 219, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            }}
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
        {/* Progress dots */}
        <div className="mt-2 flex justify-between">
          {wizardSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full border-2 transition-all duration-300 ${
                idx <= currentIndex
                  ? 'bg-primary-accent border-primary-accent-light shadow-[0_0_8px_rgba(167,218,219,0.6)]'
                  : 'bg-primary-accent border-primary-accent-light/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-2">
        {wizardSteps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const canAccess = idx <= currentIndex;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelect?.(idx)}
              disabled={!canAccess}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isCurrent
                  ? 'bg-secondary-accent shadow-secondary-accent/25 text-white shadow-lg'
                  : isCompleted
                    ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent hover:bg-primary-accent/15 border'
                    : canAccess
                      ? 'text-text-secondary border border-white/10 bg-white/5 hover:bg-white/10'
                      : 'text-text-disabled cursor-not-allowed bg-white/5'
              } ${canAccess ? 'cursor-pointer' : 'cursor-not-allowed'} `}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="flex items-center gap-2">
                {isCompleted && (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {isCurrent && <div className="h-2 w-2 rounded-full bg-white" />}
                {idx + 1}. {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
