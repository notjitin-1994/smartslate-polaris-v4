'use client';

import React, { useState } from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isMultiselectQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper } from './BaseInput';
import { cn } from '@/lib/utils';

export const MultiselectInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isMultiselectQuestion(question)) {
    console.warn('MultiselectInput received non-multiselect question:', question);
    return null;
  }

  const inputId = `multiselect-${question.id}`;
  const hasError = !!error;
  const selectedValues = Array.isArray(value) ? value : [];

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return;

    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];

    // Check max selections limit
    if (question.maxSelections && newValues.length > question.maxSelections) {
      return;
    }

    onChange(newValues);
  };

  const handleRemoveOption = (optionValue: string) => {
    if (disabled) return;
    const newValues = selectedValues.filter((v) => v !== optionValue);
    onChange(newValues);
  };

  const selectedOptions =
    question.options?.filter((opt) => selectedValues.includes(opt.value)) || [];

  const containerClasses = cn(
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white',
    'cursor-pointer ring-0 transition outline-none',
    hasError
      ? 'border-red-400/50 focus:border-red-400/50 focus:ring-[1.2px] focus:ring-red-400/50'
      : 'focus:border-[#a7dadb] focus:ring-[1.2px] focus:ring-[#a7dadb]',
    disabled && 'cursor-not-allowed disabled:opacity-50'
  );

  return (
    <InputWrapper
      question={question}
      error={error}
      disabled={disabled}
      className={className}
      inputId={inputId}
      value={value}
      onChange={onChange}
    >
      <div className="relative">
        {/* Selected values display */}
        <div
          className={containerClasses}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            minHeight: '44px',
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onBlur={onBlur}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${inputId}-options`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-white/40">Select options...</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option, index) => (
                <span
                  key={`selected-${option.value}-${index}`}
                  className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(167, 218, 219, 0.15)',
                    color: '#a7dadb',
                  }}
                >
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOption(option.value);
                      }}
                      className="ml-1 hover:opacity-70"
                      style={{ color: '#a7dadb' }}
                      aria-label={`Remove ${option.label}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-5 w-5"
              style={{ color: '#a7dadb' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>

        {/* Options dropdown */}
        {isOpen && !disabled && (
          <div
            id={`${inputId}-options`}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 shadow-lg"
            style={{
              backgroundColor: 'rgba(13, 27, 42, 0.95)',
              backdropFilter: 'blur(12px)',
            }}
            role="listbox"
          >
            {question.options?.map((option, index) => (
              <div
                key={`option-${option.value}-${index}`}
                className={cn(
                  'cursor-pointer px-3 py-2 text-white transition-colors',
                  option.disabled && 'cursor-not-allowed opacity-50'
                )}
                style={{
                  backgroundColor: selectedValues.includes(option.value)
                    ? 'rgba(167, 218, 219, 0.15)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!option.disabled && !selectedValues.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedValues.includes(option.value)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => !option.disabled && handleToggleOption(option.value)}
                role="option"
                aria-selected={selectedValues.includes(option.value)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => {}} // Handled by parent onClick
                    className="mr-2 h-4 w-4 rounded transition"
                    style={{
                      accentColor: '#a7dadb',
                    }}
                    disabled={option.disabled}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      selectedValues.includes(option.value) ? 'font-medium' : 'font-normal'
                    )}
                  >
                    {option.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {question.maxSelections && (
        <p className="mt-1 text-xs text-white/60">
          {selectedValues.length} / {question.maxSelections} selections
        </p>
      )}
    </InputWrapper>
  );
};

export default MultiselectInput;
