'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  allowApproximate?: boolean;
  className?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  currency = 'USD',
  placeholder = '0',
  error,
  helpText,
  required = false,
  disabled = false,
  allowApproximate = false,
  className,
}: CurrencyInputProps): React.JSX.Element {
  const hasError = !!error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(rawValue ? Number(rawValue) : 0);
  };

  const formatValue = (val: number): string => {
    if (val === 0) return '';
    return val.toLocaleString('en-US');
  };

  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹',
    };
    return symbols[curr] || curr;
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

      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
          aria-hidden="true"
        >
          <span className="text-primary-accent text-base font-semibold">
            {getCurrencySymbol(currency)}
          </span>
        </div>
        <input
          type="text"
          value={formatValue(value)}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'text-foreground placeholder-text-disabled h-[3.25rem] w-full rounded-[0.875rem] border-[1.5px] bg-[rgba(13,27,42,0.4)] py-3 pr-4 pl-11 text-base font-normal',
            'transition-all duration-300 outline-none',
            'shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)]',
            'hover:border-[var(--border-strong)] hover:bg-[rgba(13,27,42,0.5)]',
            hasError
              ? 'border-error/70 focus:border-error focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]'
              : 'focus:border-primary border-[var(--border-medium)] focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15),inset_0_1px_2px_rgba(0,0,0,0.1),var(--glow-subtle)]',
            disabled && 'cursor-not-allowed bg-[rgba(13,27,42,0.3)] opacity-50'
          )}
          aria-label={label}
          aria-invalid={hasError}
        />
      </div>

      {allowApproximate && (
        <p className="text-text-secondary text-[13px] italic">Approximate amounts are fine</p>
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
