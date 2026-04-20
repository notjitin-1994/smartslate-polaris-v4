'use client';

import React from 'react';

type QuestionnaireInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
};

export function QuestionnaireInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  helpText,
  required = false,
  multiline = false,
  rows = 4,
}: QuestionnaireInputProps): React.JSX.Element {
  // Create unique ID for label association
  const inputId = React.useId();

  const baseClasses = `
    w-full rounded-[0.875rem] border-[1.5px] bg-[rgba(13,27,42,0.4)] px-4 text-base text-foreground placeholder-text-disabled
    outline-none transition-all duration-300 font-normal
    shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)]
    hover:border-[var(--border-strong)] hover:bg-[rgba(13,27,42,0.5)]
    focus:border-primary focus:bg-[rgba(13,27,42,0.6)]
    focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15),inset_0_1px_2px_rgba(0,0,0,0.1),var(--glow-subtle)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const inputClasses = `
    ${baseClasses}
    ${error ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]' : 'border-[var(--border-medium)]'}
    ${multiline ? 'h-auto min-h-[120px] py-3.5 resize-none leading-relaxed' : 'h-[3.25rem]'}
  `;

  return (
    <div className="space-y-2.5">
      <label
        htmlFor={inputId}
        className="text-foreground block text-[15px] leading-tight font-medium"
      >
        {label}
        {required && <span className="text-primary ml-1.5 font-semibold">*</span>}
      </label>

      {helpText && <p className="text-text-secondary text-[13px] leading-snug">{helpText}</p>}

      {multiline ? (
        <textarea
          id={inputId}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
        />
      ) : (
        <input
          id={inputId}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

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
