'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxPillOption {
  value: string;
  label: string;
  icon?: string;
}

export interface CheckboxPillGroupProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: CheckboxPillOption[];
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

export function CheckboxPillGroup({
  label,
  value,
  onChange,
  options,
  error,
  helpText,
  required = false,
  disabled = false,
  maxSelections,
  className,
}: CheckboxPillGroupProps): React.JSX.Element {
  const hasError = !!error;

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const isSelected = value.includes(optionValue);
    if (isSelected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, optionValue]);
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

      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isSelected = value.includes(option.value);
          const isDisabled =
            disabled ||
            (!isSelected && maxSelections !== undefined && value.length >= maxSelections);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={isDisabled}
              className={cn(
                'rounded-full px-5 py-2.5 text-[15px] font-medium transition-all duration-200',
                'focus-visible:ring-secondary/50 border-[1.5px] focus-visible:ring-2 focus-visible:ring-offset-2',
                isDisabled && 'cursor-not-allowed opacity-50',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_4px_12px_rgba(167,218,219,0.3)]'
                  : 'text-text-secondary hover:text-foreground border-neutral-300 bg-white/5 hover:border-neutral-400 hover:bg-white/10',
                hasError && 'border-error/50'
              )}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {maxSelections && (
        <p className="text-text-secondary text-[13px] font-medium">
          {value.length} / {maxSelections} selected
        </p>
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
