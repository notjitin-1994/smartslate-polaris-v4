'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface NumberSpinnerProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  icon?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function NumberSpinner({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
}: NumberSpinnerProps): React.JSX.Element {
  const hasError = !!error;

  const increment = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(value + step, max));
  };

  const decrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(value - step, min));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

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

      <div className="flex items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-neutral-200 bg-white/5">
          <button
            type="button"
            onClick={decrement}
            disabled={disabled || value <= min}
            className={cn(
              'flex h-11 w-11 items-center justify-center transition-colors',
              'focus-visible:ring-secondary/50 hover:bg-white/10 focus-visible:ring-2',
              (disabled || value <= min) && 'cursor-not-allowed opacity-50'
            )}
            aria-label="Decrease"
          >
            <svg
              className="text-foreground h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
            </svg>
          </button>

          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={cn(
              'text-foreground w-20 border-x border-neutral-200 bg-transparent py-2.5 text-center text-base font-medium',
              'focus:outline-none',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label={label}
          />

          <button
            type="button"
            onClick={increment}
            disabled={disabled || value >= max}
            className={cn(
              'flex h-11 w-11 items-center justify-center transition-colors',
              'focus-visible:ring-secondary/50 hover:bg-white/10 focus-visible:ring-2',
              (disabled || value >= max) && 'cursor-not-allowed opacity-50'
            )}
            aria-label="Increase"
          >
            <svg
              className="text-foreground h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {suffix && <span className="text-text-secondary text-[15px] font-medium">{suffix}</span>}
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
