'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioCardOption {
  value: string;
  label: string;
  icon?: string;
  description: string;
  example?: string;
}

export interface RadioCardGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioCardOption[];
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RadioCardGroup({
  label,
  value,
  onChange,
  options,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
}: RadioCardGroupProps): React.JSX.Element {
  const hasError = !!error;

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-body text-text-secondary block font-medium">
        {label}
        {required && (
          <span className="text-primary ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {helpText && <p className="text-caption text-text-disabled">{helpText}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              'group relative rounded-xl p-4 text-left transition-all duration-200',
              'focus-visible:ring-secondary/50 border focus-visible:ring-2 focus-visible:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              value === option.value
                ? 'border-primary bg-primary/10'
                : 'border-neutral-200 bg-white/5 hover:border-neutral-300 hover:bg-white/10',
              hasError && 'border-error/50'
            )}
            aria-pressed={value === option.value}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold">{option.label}</span>
                  {value === option.value && (
                    <svg className="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-caption text-text-secondary">{option.description}</p>
                {option.example && (
                  <p className="text-caption text-text-disabled mt-1 italic">
                    Example: {option.example}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasError && (
        <p
          className="animate-fade-in text-caption text-error flex items-center gap-1"
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
