'use client';

import React from 'react';

type QuestionnaireSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
};

export function QuestionnaireSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  error,
  helpText,
  required = false,
}: QuestionnaireSelectProps): React.JSX.Element {
  // Create a unique ID for label association
  const selectId = React.useId();

  const selectClasses = `
    w-full h-[3.25rem] rounded-[0.875rem] border-[1.5px] bg-[rgba(13,27,42,0.4)] px-4 text-base text-foreground
    outline-none transition-all duration-300 font-normal cursor-pointer appearance-none
    shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)]
    hover:border-[var(--border-strong)] hover:bg-[rgba(13,27,42,0.5)]
    focus:border-primary focus:bg-[rgba(13,27,42,0.6)]
    focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15),inset_0_1px_2px_rgba(0,0,0,0.1),var(--glow-subtle)]
    ${error ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]' : 'border-[var(--border-medium)]'}
  `;

  return (
    <div className="space-y-2.5">
      <label
        htmlFor={selectId}
        className="text-foreground block text-[15px] leading-tight font-medium"
      >
        {label}
        {required && <span className="text-primary ml-1.5 font-semibold">*</span>}
      </label>

      {helpText && <p className="text-text-secondary text-[13px] leading-snug">{helpText}</p>}

      <div className="relative">
        <select
          id={selectId}
          className={selectClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a7dadb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 1rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.25em 1.25em',
            paddingRight: '3rem',
          }}
        >
          {!value && (
            <option
              value=""
              disabled
              className="text-text-disabled rounded-lg border border-white/10 bg-[rgba(13,27,42,0.9)] backdrop-blur-sm"
            >
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option
              key={`${option.value}-${index}`}
              value={option.value}
              disabled={option.disabled}
              className="text-foreground rounded-lg border border-white/10 bg-[rgba(13,27,42,0.9)] backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-[rgba(13,27,42,0.95)]"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
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
}
