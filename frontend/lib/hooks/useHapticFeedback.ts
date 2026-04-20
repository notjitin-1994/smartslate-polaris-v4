'use client';

import { useCallback, useMemo } from 'react';

export interface HapticFeedbackConfig {
  /**
   * Whether haptic feedback is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Duration for light feedback (ms)
   * @default 10
   */
  lightDuration?: number;

  /**
   * Duration for medium feedback (ms)
   * @default 20
   */
  mediumDuration?: number;

  /**
   * Duration for heavy feedback (ms)
   * @default 50
   */
  heavyDuration?: number;

  /**
   * Pattern for success feedback
   * @default [10, 50, 10]
   */
  successPattern?: number[];

  /**
   * Pattern for error feedback
   * @default [20, 100, 20, 100, 20]
   */
  errorPattern?: number[];

  /**
   * Pattern for warning feedback
   * @default [10, 30, 10]
   */
  warningPattern?: number[];
}

export interface HapticFeedbackHandlers {
  /**
   * Trigger light haptic feedback
   */
  light: () => void;

  /**
   * Trigger medium haptic feedback
   */
  medium: () => void;

  /**
   * Trigger heavy haptic feedback
   */
  heavy: () => void;

  /**
   * Trigger success haptic feedback
   */
  success: () => void;

  /**
   * Trigger error haptic feedback
   */
  error: () => void;

  /**
   * Trigger warning haptic feedback
   */
  warning: () => void;

  /**
   * Trigger custom haptic pattern
   */
  custom: (pattern: number | number[]) => void;

  /**
   * Check if haptic feedback is supported
   */
  isSupported: boolean;
}

export interface UseHapticFeedbackOptions {
  /**
   * Configuration for haptic feedback behavior
   */
  config?: HapticFeedbackConfig;
}

/**
 * Custom hook for managing haptic feedback with cross-platform support
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const haptic = useHapticFeedback({
 *     config: {
 *       enabled: true,
 *       lightDuration: 10,
 *       mediumDuration: 20,
 *     },
 *   })
 *
 *   return (
 *     <button onClick={() => haptic.medium()}>
 *       Click me for haptic feedback
 *     </button>
 *   )
 * }
 * ```
 */
export function useHapticFeedback(options: UseHapticFeedbackOptions = {}): HapticFeedbackHandlers {
  const { config = {} } = options;

  const {
    enabled = true,
    lightDuration = 10,
    mediumDuration = 20,
    heavyDuration = 50,
    successPattern = [10, 50, 10],
    errorPattern = [20, 100, 20, 100, 20],
    warningPattern = [10, 30, 10],
  } = config;

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;

    return 'vibrate' in navigator;
  }, []);

  const triggerVibration = useCallback(
    (pattern: number | number[]) => {
      if (!enabled || !isSupported) return;

      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.warn('Haptic feedback failed:', error);
      }
    },
    [enabled, isSupported]
  );

  const handlers: HapticFeedbackHandlers = useMemo(
    () => ({
      light: () => triggerVibration(lightDuration),

      medium: () => triggerVibration(mediumDuration),

      heavy: () => triggerVibration(heavyDuration),

      success: () => triggerVibration(successPattern),

      error: () => triggerVibration(errorPattern),

      warning: () => triggerVibration(warningPattern),

      custom: (pattern: number | number[]) => triggerVibration(pattern),

      isSupported,
    }),
    [
      triggerVibration,
      lightDuration,
      mediumDuration,
      heavyDuration,
      successPattern,
      errorPattern,
      warningPattern,
      isSupported,
    ]
  );

  return handlers;
}
