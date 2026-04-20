'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Skeleton components for loading states
export const FormSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Progress bar skeleton */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
    </div>

    {/* Section skeleton */}
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-64 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Questions skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        ))}
      </div>
    </div>

    {/* Action buttons skeleton */}
    <div className="flex justify-between border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <div className="h-10 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-10 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  </div>
);

export const SectionSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-4', className)}>
    <div className="space-y-2">
      <div className="h-6 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-4 w-64 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>

    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      ))}
    </div>
  </div>
);

export const InputSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-2', className)}>
    <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
    <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
  </div>
);

// Loading spinner component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'border-t-primary animate-spin rounded-full border-2 border-neutral-300',
        sizeClasses[size],
        className
      )}
    />
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  className?: string;
}> = ({ isVisible, message = 'Loading...', className }) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black',
        className
      )}
    >
      <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-lg font-medium text-neutral-900 dark:text-white">{message}</span>
        </div>
      </div>
    </div>
  );
};

// Save status indicator
export const SaveStatusIndicator: React.FC<{
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  className?: string;
}> = ({ status, lastSaved, className }) => {
  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">Saved {lastSaved ? lastSaved.toLocaleTimeString() : ''}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className={cn('text-center', className)}>{getStatusContent()}</div>;
};

// Progressive loading component
export const ProgressiveLoader: React.FC<{
  items: Array<{ id: string; loaded: boolean; component: React.ReactNode }>;
  className?: string;
}> = ({ items, className }) => (
  <div className={cn('space-y-4', className)}>
    {items.map((item) => (
      <div key={item.id} className="transition-opacity duration-300">
        {item.loaded ? item.component : <InputSkeleton />}
      </div>
    ))}
  </div>
);

// Shimmer effect for skeleton components
export const ShimmerEffect: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'relative overflow-hidden',
      'before:absolute before:inset-0 before:-translate-x-full',
      'before:animate-[shimmer_2s_infinite] before:bg-white/20',
      className
    )}
  />
);

// Add shimmer animation to CSS
const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;

// Inject shimmer styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerStyles;
  document.head.appendChild(styleSheet);
}
