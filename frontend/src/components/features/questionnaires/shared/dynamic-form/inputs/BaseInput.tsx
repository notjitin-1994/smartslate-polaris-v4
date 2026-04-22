'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BaseInputProps } from '@/lib/dynamic-form';

interface InputWrapperProps extends BaseInputProps {
  children: React.ReactNode;
  inputId: string;
}

export const InputWrapper: React.FC<InputWrapperProps> = ({
  question,
  error,
  disabled,
  className,
  children,
  inputId,
  ..._accessibilityProps
}) => {
  const hasError = !!error;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={inputId}
        className="text-foreground block text-[15px] leading-tight font-medium"
      >
        {question.label}
        {question.required && (
          <span className="text-primary ml-1.5 font-semibold" aria-label="required">
            *
          </span>
        )}
      </label>

      {question.helpText && (
        <p className="text-text-secondary mb-2 text-[13px] leading-snug">{question.helpText}</p>
      )}

      <div className="relative">{children}</div>

      {hasError && (
        <div
          className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="leading-tight">{error}</span>
        </div>
      )}
    </div>
  );
};

interface BaseInputFieldProps {
  id: string;
  name: string;
  type?: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
  maxLength?: number;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export const BaseInputField: React.FC<BaseInputFieldProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  disabled,
  required,
  placeholder,
  error,
  className,
  maxLength,
  ...props
}) => {
  const hasError = !!error;

  const inputClasses = cn(
    'text-foreground placeholder-text-disabled h-[3.25rem] w-full rounded-[0.875rem] border-[1.5px] bg-[rgba(13,27,42,0.4)] px-4 text-base font-normal',
    'transition-all duration-300 outline-none',
    'shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)]',
    'hover:border-[var(--border-strong)] hover:bg-[rgba(13,27,42,0.5)]',
    hasError
      ? 'border-error/70 focus:border-error focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]'
      : 'focus:border-primary border-[var(--border-medium)] focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15),inset_0_1px_2px_rgba(0,0,0,0.1),var(--glow-subtle)]',
    disabled && 'cursor-not-allowed bg-[rgba(13,27,42,0.3)] opacity-50',
    className
  );

  return (
    <input
      id={id}
      name={name}
      type={type}
      value={String(value || '')}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={inputClasses}
      {...props}
    />
  );
};
