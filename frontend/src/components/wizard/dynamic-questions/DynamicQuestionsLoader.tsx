'use client';

import { useEffect, useState } from 'react';

export interface DynamicQuestionsLoaderProps {
  /**
   * Custom loading message to display
   * @default 'Initializing AI analysis...'
   */
  message?: string;
  /**
   * Whether to show the pulsing status indicator
   * @default true
   */
  showStatusIndicator?: boolean;
  /**
   * Custom status text in the indicator pill
   * @default 'Preparing'
   */
  statusText?: string;
  /**
   * Container className for additional styling
   */
  className?: string;
}

/**
 * DynamicQuestionsLoader - Loading screen for dynamic questionnaire generation
 *
 * Exact replica of the smartslate-polaris dynamic questions loading screen,
 * adapted to the frontend folder's design system and styling guidelines.
 *
 * Features:
 * - Large animated spinner matching brand colors
 * - Dynamic progress message
 * - Pulsing status indicator pill
 * - Glassmorphic design language
 * - Accessibility compliant
 *
 * @example
 * ```tsx
 * <DynamicQuestionsLoader
 *   message="Generating personalized questions..."
 *   statusText="Analyzing"
 * />
 * ```
 */
export function DynamicQuestionsLoader({
  message = 'Initializing AI analysis...',
  showStatusIndicator = true,
  statusText = 'Preparing',
  className = '',
}: DynamicQuestionsLoaderProps): React.JSX.Element {
  const [dots, setDots] = useState('');

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`animate-fade-in py-12 text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading personalized questions"
    >
      {/* Large Spinner */}
      <div className="relative mb-4 inline-block">
        {/* Background ring */}
        <div className="border-primary/20 h-16 w-16 rounded-full border-2" aria-hidden="true" />
        {/* Animated spinning ring */}
        <div
          className="border-b-primary absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent"
          style={{ animationDuration: '1s' }}
          aria-hidden="true"
        />
      </div>

      {/* Progress Message */}
      <p className="text-foreground/80 mb-4 min-h-[28px] text-lg">
        {message}
        <span className="inline-block w-8 text-left" aria-hidden="true">
          {dots}
        </span>
      </p>

      {/* Status Indicator Pill */}
      {showStatusIndicator && (
        <div
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all duration-300"
          style={{
            backgroundColor: 'rgba(var(--color-primary-rgb, 167, 218, 219), 0.1)',
            borderColor: 'rgba(var(--color-primary-rgb, 167, 218, 219), 0.2)',
          }}
        >
          {/* Pulsing dot */}
          <div
            className="bg-primary h-2 w-2 animate-pulse rounded-full"
            style={{ animationDuration: '1.5s' }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-medium"
            style={{ color: 'rgba(var(--color-primary-rgb, 167, 218, 219), 0.9)' }}
          >
            {statusText}
          </span>
        </div>
      )}

      {/* Screen reader only text */}
      <span className="sr-only">Loading personalized questions. Please wait.</span>
    </div>
  );
}

/**
 * DynamicQuestionsLoaderCard - Full card wrapper with glass effect
 *
 * Use this variant when you need a standalone card with the loader.
 * Matches the WizardContainer pattern from smartslate-polaris.
 *
 * @example
 * ```tsx
 * <DynamicQuestionsLoaderCard
 *   title="Preparing Your Starmap"
 *   description="Setting up the AI analysis pipeline and preparing your personalized questions."
 *   message="Analyzing your responses..."
 * />
 * ```
 */
export interface DynamicQuestionsLoaderCardProps extends DynamicQuestionsLoaderProps {
  /**
   * Card title
   * @default 'Preparing Your Questions'
   */
  title?: string;
  /**
   * Card description/subtitle
   */
  description?: string;
}

export function DynamicQuestionsLoaderCard({
  title = 'Preparing Your Questions',
  description,
  message,
  showStatusIndicator = true,
  statusText,
  className = '',
}: DynamicQuestionsLoaderCardProps): React.JSX.Element {
  return (
    <div className={`animate-scale-in ${className}`}>
      <div className="glass-card overflow-hidden">
        {/* Header Section */}
        {(title || description) && (
          <div
            className="border-b border-white/10 p-6 md:p-8"
            style={{
              background:
                'linear-gradient(90deg, rgba(167, 218, 219, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="text-foreground font-heading mb-2 text-2xl font-bold md:text-3xl">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-text-secondary text-sm leading-relaxed md:text-base">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loader Content */}
        <div className="p-6 md:p-8">
          <DynamicQuestionsLoader
            message={message}
            showStatusIndicator={showStatusIndicator}
            statusText={statusText}
          />
        </div>
      </div>
    </div>
  );
}
