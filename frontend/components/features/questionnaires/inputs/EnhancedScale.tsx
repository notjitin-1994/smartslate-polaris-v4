'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EnhancedScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  icons?: string[];
  colors?: string[];
  showExplanation?: boolean;
  explanations?: string[];
  unit?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function EnhancedScale({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  minLabel,
  maxLabel,
  showExplanation = false,
  explanations,
  unit,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
}: EnhancedScaleProps): React.JSX.Element {
  const hasError = !!error;
  const options = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }

  return (
    <div className={cn('space-y-4', className)}>
      <label className="text-foreground block text-[15px] leading-tight font-medium">
        {label}
        {required && (
          <span className="text-primary ml-1.5 font-semibold" aria-label="required">
            *
          </span>
        )}
      </label>

      {helpText && <p className="text-text-secondary text-[13px] leading-snug">{helpText}</p>}

      {/* Labels */}
      {(minLabel || maxLabel) && (
        <div className="text-text-secondary flex justify-between text-[13px] font-medium">
          {minLabel && <span>{minLabel}</span>}
          {maxLabel && <span>{maxLabel}</span>}
        </div>
      )}

      {/* Scale buttons */}
      <div className="flex items-center justify-between gap-2">
        {options.map((option, index) => {
          const isSelected = value === option;
          const intensity = index / (options.length - 1);

          return (
            <button
              key={option}
              type="button"
              onClick={() => !disabled && onChange(option)}
              disabled={disabled}
              className={cn(
                'flex flex-1 flex-col items-center justify-center rounded-xl p-3 transition-all duration-200',
                'focus-visible:ring-secondary/50 border-[1.5px] focus-visible:ring-2',
                disabled && 'cursor-not-allowed opacity-50',
                isSelected
                  ? 'border-primary bg-primary/15 shadow-md'
                  : 'border-neutral-200 bg-white/5 hover:border-neutral-300 hover:bg-white/10',
                hasError && 'border-error/50'
              )}
              style={isSelected ? { boxShadow: '0 4px 12px rgba(167, 218, 219, 0.25)' } : undefined}
              aria-pressed={isSelected}
              title={explanations?.[index]}
            >
              <span
                className={cn(
                  'text-xl font-semibold transition-colors',
                  isSelected ? 'text-primary-accent' : 'text-text-secondary'
                )}
              >
                {option}
              </span>
              {unit && (
                <span className="text-text-disabled mt-1 text-[11px] font-medium">{unit}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Show explanation for selected value */}
      {showExplanation && explanations && value >= min && value <= max && (
        <div className="animate-fade-in bg-primary/5 border-primary/10 rounded-lg border p-3">
          <p className="text-text-secondary text-[13px] leading-relaxed">
            {explanations[Math.floor((value - min) / step)]}
          </p>
        </div>
      )}

      {hasError && (
        <p
          className="animate-fade-in text-error flex items-center gap-1 text-[13px] font-medium"
          role="alert"
          aria-live="polite"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
