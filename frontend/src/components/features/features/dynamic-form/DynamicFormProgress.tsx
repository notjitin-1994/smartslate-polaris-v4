'use client';

import React from 'react';

type DynamicFormProgressProps = {
  currentSection: number;
  totalSections: number;
  sectionTitle?: string;
  sectionDescription?: string;
};

export function DynamicFormProgress({
  currentSection,
  totalSections,
  sectionTitle,
  sectionDescription,
}: DynamicFormProgressProps): React.JSX.Element {
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="animate-fade-in-up mb-10 space-y-6">
      {/* Progress bar with segments */}
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
          {Array.from({ length: totalSections }).map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-full border-2 transition-all duration-300 ${
                index <= currentSection
                  ? 'bg-primary-accent border-primary-accent-light shadow-[0_0_8px_rgba(167,218,219,0.6)]'
                  : 'bg-background border-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step info with refined typography */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 border-primary/20 text-primary-accent inline-flex h-7 items-center justify-center rounded-full border px-3 text-[13px] font-semibold tracking-wide">
              Section {currentSection + 1} of {totalSections}
            </span>
          </div>
          {sectionTitle && (
            <h3 className="text-foreground font-heading text-[22px] leading-tight font-semibold tracking-tight">
              {sectionTitle}
            </h3>
          )}
          {sectionDescription && (
            <p className="text-text-secondary max-w-lg text-[15px] leading-relaxed">
              {sectionDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
