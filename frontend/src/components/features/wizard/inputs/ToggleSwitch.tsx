'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleSwitchOption {
  value: string;
  label: string;
  icon?: string;
}

export interface ToggleSwitchProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [ToggleSwitchOption, ToggleSwitchOption]; // Exactly 2 options
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({
  label,
  value,
  onChange,
  options,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
}: ToggleSwitchProps): React.JSX.Element {
  const hasError = !!error;

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-foreground block text-[15px] leading-tight font-medium">
        {label}
        {required && (
          <span className="text-primary ml-1.5 font-semibold" aria-label="required">
            *
          </span>
        )}
      </label>

      {helpText && <p className="text-text-secondary text-[13px] leading-snug">{helpText}</p>}

      <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/5 p-1">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={cn(
                'rounded-full px-5 py-2 text-[15px] font-medium transition-all duration-200',
                'focus-visible:ring-secondary/50 focus-visible:ring-2 focus-visible:ring-offset-2',
                disabled && 'cursor-not-allowed opacity-50',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-text-secondary hover:text-foreground',
                hasError && 'ring-error/50 ring-2'
              )}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>

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
