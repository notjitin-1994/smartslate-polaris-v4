'use client';

/**
 * Generation Source Badge Component
 * Displays the source of dynamic question generation (Perplexity or Ollama)
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface GenerationSourceBadgeProps {
  source: 'perplexity' | 'ollama';
  fallbackUsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GenerationSourceBadge({
  source,
  fallbackUsed = false,
  className = '',
  size = 'md',
}: GenerationSourceBadgeProps): React.JSX.Element {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (source === 'perplexity') {
    return (
      <div
        className={cn(
          'border-primary/30 bg-primary/10 dark:border-primary-dark dark:bg-primary/20 inline-flex items-center rounded-full border transition-all hover:scale-105',
          sizeClasses[size],
          className
        )}
        title="Questions generated using Perplexity AI with web research capabilities"
      >
        <svg
          className={cn('text-primary dark:text-primary-light', iconSize[size])}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-primary-dark dark:text-primary-light font-semibold">
          Perplexity Research
        </span>
      </div>
    );
  }

  // Ollama badge (with fallback indication)
  if (fallbackUsed) {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border border-yellow-300 bg-yellow-100 transition-all hover:scale-105 dark:border-yellow-700 dark:bg-yellow-900',
          sizeClasses[size],
          className
        )}
        title="Questions generated using Ollama (fallback from Perplexity)"
      >
        <svg
          className={cn('text-yellow-600 dark:text-yellow-400', iconSize[size])}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-semibold text-yellow-700 dark:text-yellow-300">Ollama Fallback</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-secondary/30 bg-secondary/10 dark:border-secondary-dark dark:bg-secondary/20 inline-flex items-center rounded-full border transition-all hover:scale-105',
        sizeClasses[size],
        className
      )}
      title="Questions generated using Ollama AI locally"
    >
      <svg
        className={cn('text-secondary dark:text-secondary-light', iconSize[size])}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-secondary-dark dark:text-secondary-light font-semibold">Ollama AI</span>
    </div>
  );
}
