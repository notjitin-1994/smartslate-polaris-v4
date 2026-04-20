'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isScaleQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper } from './BaseInput';
import { cn } from '@/lib/utils';

export const ScaleInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  // Enhanced validation
  if (!isScaleQuestion(question)) {
    return null;
  }

  const inputId = `scale-${question.id}`;
  const hasError = !!error;

  // Defensive: Ensure scaleConfig exists with defaults
  const config = question.scaleConfig || {
    min: 1,
    max: 5,
    step: 1,
    minLabel: 'Low',
    maxLabel: 'High',
  };

  const min = config.min ?? 1;
  const max = config.max ?? 5;
  const step = config.step ?? 1;

  // Generate scale options
  const scaleOptions = [];
  for (let i = min; i <= max; i += step) {
    scaleOptions.push(i);
  }

  return (
    <InputWrapper
      question={question}
      error={error}
      disabled={disabled}
      className={className}
      value={value}
      onChange={onChange}
      inputId={inputId}
    >
      <div className="space-y-4">
        {/* Scale labels */}
        <div className="flex justify-between text-sm text-white/60">
          {config?.minLabel && <span>{config.minLabel}</span>}
          {config?.maxLabel && <span>{config.maxLabel}</span>}
        </div>

        {/* Scale options */}
        <div className="flex items-center justify-between space-x-2">
          {scaleOptions.map((option) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer flex-col items-center',
                disabled && 'cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(parseInt(e.target.value))}
                onBlur={onBlur}
                disabled={disabled}
                required={question.required}
                className="sr-only"
                aria-describedby={hasError ? `${inputId}-error` : undefined}
              />
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200',
                  disabled && 'cursor-not-allowed disabled:opacity-50',
                  hasError && 'border-red-400/50'
                )}
                style={{
                  backgroundColor: value === option ? '#a7dadb' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: value === option ? '#a7dadb' : 'rgba(255, 255, 255, 0.1)',
                  color: value === option ? '#020C1B' : '#e0e0e0',
                }}
                onMouseEnter={(e) => {
                  if (value !== option && !disabled) {
                    e.currentTarget.style.borderColor = 'rgba(167, 218, 219, 0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                {option}
              </div>
            </label>
          ))}
        </div>

        {/* Range slider alternative */}
        <div className="mt-4">
          <div className="relative h-2 w-full">
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                backgroundColor: hasError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <div
              className="absolute h-full rounded-lg"
              style={{
                width: `${(((value || min) - min) / (max - min)) * 100}%`,
                backgroundColor: '#a7dadb',
              }}
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value || min}
              onChange={(e) => onChange(parseInt(e.target.value))}
              onBlur={onBlur}
              disabled={disabled}
              className={cn(
                'absolute inset-0 h-2 w-full cursor-pointer appearance-none rounded-lg opacity-0',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            />
          </div>
        </div>

        {/* Current value display */}
        <div className="text-center">
          <span className="text-lg font-semibold text-white">{value || min}</span>
          <span className="ml-1 text-sm text-white/60">/ {max}</span>
        </div>
      </div>
    </InputWrapper>
  );
};

export default ScaleInput;
