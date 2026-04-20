'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SliderMarker {
  value: number;
  label: string;
}

export interface LabeledSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  markers?: SliderMarker[];
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LabeledSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  markers,
  error,
  helpText,
  required = false,
  disabled = false,
  className,
}: LabeledSliderProps): React.JSX.Element {
  const hasError = !!error;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      <label className="text-foreground block text-[15px] leading-tight font-medium">
        {label}
        {required && (
          <span className="text-primary ml-1.5 font-semibold" aria-label="required">
            *
          </span>
        )}
      </label>

      {helpText && <p className="text-text-secondary text-[13px] leading-snug">{helpText}</p>}

      <div className="space-y-3">
        {/* Value display */}
        <div className="flex items-center justify-center">
          <div className="bg-primary/10 border-primary/20 inline-flex items-baseline gap-2 rounded-xl border px-5 py-2.5">
            <span className="text-primary-accent text-3xl font-semibold">{value}</span>
            {unit && <span className="text-text-secondary text-[15px] font-medium">{unit}</span>}
          </div>
        </div>

        {/* Slider */}
        <div className="relative px-2 py-4">
          <div className="relative h-2.5 w-full">
            {/* Background track */}
            <div className="absolute inset-0 rounded-full bg-white/10" />

            {/* Filled track */}
            <div
              className="bg-primary absolute h-full rounded-full transition-all duration-200"
              style={{
                width: `${percentage}%`,
                boxShadow: '0 0 12px rgba(167, 218, 219, 0.4)',
              }}
            />

            {/* Slider input */}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
              className={cn(
                'absolute inset-0 w-full cursor-pointer appearance-none bg-transparent',
                '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:bg-primary-accent [&::-webkit-slider-thumb]:rounded-full',
                '[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(167,218,219,0.2),0_2px_8px_rgba(0,0,0,0.2)]',
                '[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200',
                '[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95',
                '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full',
                '[&::-moz-range-thumb]:bg-primary-accent [&::-moz-range-thumb]:border-0',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            />
          </div>

          {/* Markers */}
          {markers && (
            <div className="mt-3 flex justify-between">
              {markers.map((marker, index) => (
                <button
                  key={`marker-${marker.value}-${index}`}
                  type="button"
                  onClick={() => !disabled && onChange(marker.value)}
                  className="text-text-disabled hover:text-foreground text-[11px] font-medium transition-colors"
                  disabled={disabled}
                >
                  {marker.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
