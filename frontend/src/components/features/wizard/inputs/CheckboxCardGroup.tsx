'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxCardOption {
  value: string;
  label: string;
  icon?: string;
  description: string;
}

export interface CheckboxCardGroupProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: CheckboxCardOption[];
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  allowMultiple?: boolean;
  className?: string;
}

export function CheckboxCardGroup({
  label,
  value,
  onChange,
  options,
  error,
  helpText,
  required = false,
  disabled = false,
  allowMultiple = true,
  className,
}: CheckboxCardGroupProps): React.JSX.Element {
  const hasError = !!error;

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const isSelected = value.includes(optionValue);
    if (isSelected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange(allowMultiple ? [...value, optionValue] : [optionValue]);
    }
  };

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
        {options.map((option) => {
          const isSelected = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
              className={cn(
                'group relative rounded-xl p-4 text-left transition-all duration-200',
                'focus-visible:ring-secondary/50 border focus-visible:ring-2 focus-visible:ring-offset-2',
                disabled && 'cursor-not-allowed opacity-50',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-neutral-200 bg-white/5 hover:border-neutral-300 hover:bg-white/10',
                hasError && 'border-error/50'
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-neutral-300 bg-white/5'
                    )}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                        <path
                          d="M10 3L4.5 8.5 2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-foreground font-semibold">{option.label}</span>
                  <p className="text-caption text-text-secondary">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
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
