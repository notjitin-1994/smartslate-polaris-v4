/**
 * Usage Error Handler Utilities
 *
 * Provides utilities for detecting and handling blueprint usage limit errors (429 responses)
 * Integrates with LimitReachedModal for user-friendly error presentation
 */

/**
 * Error response interface for limit exceeded errors
 */
export interface LimitExceededError {
  success: false;
  error: string;
  limitExceeded: true;
  status?: number;
  statusCode?: number;
}

/**
 * Check if an error response indicates a limit has been exceeded
 */
export function isLimitExceededError(error: any): error is LimitExceededError {
  if (!error) return false;

  // Check for explicit limitExceeded flag
  if (error.limitExceeded === true) return true;

  // Check for HTTP 429 status
  if (error.status === 429 || error.statusCode === 429) return true;

  // Check error message for limit-related keywords
  const message = (error.message || error.error || '').toString().toLowerCase();
  if (message.includes('limit') && (message.includes('reached') || message.includes('exceeded'))) {
    return true;
  }

  return false;
}

/**
 * Determine the type of limit from error message
 */
export function getLimitType(error: any): 'creation' | 'saving' | 'unknown' {
  const message = (error.message || error.error || '').toString().toLowerCase();

  if (message.includes('creation') || message.includes('create')) {
    return 'creation';
  }

  if (message.includes('saving') || message.includes('save')) {
    return 'saving';
  }

  return 'unknown';
}

/**
 * Extract limit information from error message
 * Parses messages like "You've reached your limit of 2 blueprint creations"
 */
export function parseLimitFromError(error: any): { current: number; limit: number } | null {
  const message = (error.message || error.error || '').toString();

  // Try to extract numbers from message
  const numberMatches = message.match(/\d+/g);
  if (numberMatches && numberMatches.length >= 1) {
    const limit = parseInt(numberMatches[0], 10);
    return {
      current: limit,
      limit: limit,
    };
  }

  return null;
}

/**
 * Handle API response and throw user-friendly error if limit exceeded
 * Use this in API calls to automatically handle limit errors
 *
 * @example
 * ```ts
 * const response = await fetch('/api/questionnaire/save', { ... });
 * const data = await handleUsageResponse(response);
 * ```
 */
export async function handleUsageResponse<T = any>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 429 || data.limitExceeded) {
      const error = {
        ...data,
        status: response.status,
        limitExceeded: true,
      };
      throw error;
    }

    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

/**
 * Create a standardized error handler for usage limit errors
 * Returns a callback that can be used in error boundaries or catch blocks
 *
 * @example
 * ```tsx
 * const handleError = createUsageErrorHandler({
 *   onLimitExceeded: (type) => {
 *     setModalOpen(true);
 *     setLimitType(type);
 *   }
 * });
 *
 * try {
 *   await saveBlueprint();
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */
export function createUsageErrorHandler(options: {
  onLimitExceeded?: (type: 'creation' | 'saving', error: any) => void;
  onGenericError?: (error: any) => void;
  silent?: boolean;
}) {
  const { onLimitExceeded, onGenericError, silent = false } = options;

  return (error: any) => {
    if (isLimitExceededError(error)) {
      const limitType = getLimitType(error);
      if (!silent) {
        console.warn('Blueprint limit exceeded:', limitType, error);
      }
      onLimitExceeded?.(limitType === 'unknown' ? 'creation' : limitType, error);
    } else {
      if (!silent) {
        console.error('Error occurred:', error);
      }
      onGenericError?.(error);
    }
  };
}

/**
 * Wrap an async function with automatic usage error handling
 * Returns a new function that catches and handles limit errors automatically
 *
 * @example
 * ```tsx
 * const saveWithErrorHandling = withUsageErrorHandling(
 *   saveBlueprintFn,
 *   {
 *     onLimitExceeded: (type) => showLimitModal(type)
 *   }
 * );
 *
 * await saveWithErrorHandling(data);
 * ```
 */
export function withUsageErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    onLimitExceeded?: (type: 'creation' | 'saving', error: any) => void;
    onGenericError?: (error: any) => void;
    silent?: boolean;
  }
): T {
  const errorHandler = createUsageErrorHandler(options);

  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }) as T;
}

/**
 * React hook for usage error handling
 * Provides error handler and state management for limit modals
 *
 * @example
 * ```tsx
 * const { handleError, showModal, limitType, closeModal } = useUsageErrorHandler();
 *
 * return (
 *   <>
 *     <Button onClick={async () => {
 *       try {
 *         await saveBlueprint();
 *       } catch (error) {
 *         handleError(error);
 *       }
 *     }}>Save</Button>
 *
 *     <LimitReachedModal
 *       isOpen={showModal}
 *       onClose={closeModal}
 *       limitType={limitType}
 *       {...otherProps}
 *     />
 *   </>
 * );
 * ```
 */
export function useUsageErrorHandler() {
  const [showModal, setShowModal] = React.useState(false);
  const [limitType, setLimitType] = React.useState<'creation' | 'saving'>('creation');
  const [errorDetails, setErrorDetails] = React.useState<any>(null);

  const handleError = React.useCallback((error: any) => {
    if (isLimitExceededError(error)) {
      const type = getLimitType(error);
      setLimitType(type === 'unknown' ? 'creation' : type);
      setErrorDetails(error);
      setShowModal(true);
    } else {
      console.error('Non-limit error:', error);
      throw error;
    }
  }, []);

  const closeModal = React.useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    handleError,
    showModal,
    limitType,
    errorDetails,
    closeModal,
  };
}

// Import React for the hook
import React from 'react';
