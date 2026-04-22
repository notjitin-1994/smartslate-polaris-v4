'use client';

import React, { useState } from 'react';
import { QuestionnaireInfoBox } from '@/components/wizard/static-questions/QuestionnaireInfoBox';

interface Section {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface DynamicQuestionnaireProgressProps {
  currentStep: number;
  totalSteps: number;
  sections: Section[];
  progress: number;
}

export function DynamicQuestionnaireProgress({
  currentStep,
  totalSteps,
  sections,
  progress,
}: DynamicQuestionnaireProgressProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="animate-fade-in-up mb-10 space-y-6">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 shadow-inner">
          <div
            className="bg-primary relative h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
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
        <div className="absolute top-1/2 right-0 left-0 flex -translate-y-1/2 justify-between px-1">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-full border-2 transition-all duration-300 ${
                index <= currentStep
                  ? 'bg-primary-accent border-primary-accent-light shadow-[0_0_8px_rgba(167,218,219,0.6)]'
                  : 'bg-primary-accent border-primary-accent-light/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step info */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 border-primary/20 text-primary-accent inline-flex h-7 items-center justify-center rounded-full border px-3 text-[13px] font-semibold tracking-wide">
              Section {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <h3 className="text-foreground font-heading text-[22px] leading-tight font-semibold tracking-tight">
            {sections[currentStep]?.title}
          </h3>
          {sections[currentStep]?.description && (
            <p className="text-text-secondary text-[15px] leading-relaxed">
              {sections[currentStep]?.description}
            </p>
          )}

          {/* Info toggle button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-primary/5 hover:bg-primary/10 border-primary/10 group flex w-full items-center justify-between rounded-lg border p-3 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-primary transition-all duration-200"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(255, 193, 7, 0.6))',
                    textShadow: '0 0 12px rgba(255, 193, 7, 0.4)',
                  }}
                >
                  💡
                </span>
                <span className="text-primary font-quicksand font-medium">About this section</span>
              </div>
              <svg
                className={`text-primary h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(167, 218, 219, 0.3))',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isExpanded && (
              <div className="animate-fade-in-up">
                <QuestionnaireInfoBox title="">
                  <div className="space-y-4">
                    <p className="text-[15px] leading-relaxed">
                      This section focuses on gathering detailed information about{' '}
                      <span className="text-primary font-semibold">
                        {sections[currentStep]?.title.toLowerCase()}
                      </span>
                      . Each question is personalized based on your organizational context and will
                      help create a comprehensive, tailored learning blueprint.
                    </p>

                    <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
                      <p className="text-primary mb-2 text-sm font-medium">
                        💡 Why These Questions Matter
                      </p>
                      <p className="text-text-secondary text-sm">
                        Every answer you provide helps us understand your unique situation better.
                        The more detailed your responses, the more precise and actionable your
                        learning blueprint will be.
                      </p>
                    </div>
                  </div>
                </QuestionnaireInfoBox>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
