/**
 * Razorpay Provider Component
 *
 * @description React provider for managing Razorpay checkout script loading and providing context to child components
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This provider handles:
 * - Dynamic script loading and verification
 * - Loading state management
 * - Error handling for script load failures
 * - Context provision for Razorpay checkout functionality
 *
 * @use client
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { getRazorpayConfig } from '@/lib/config/razorpayConfig';
import type { RazorpayInstance } from '@/types/razorpay';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Razorpay context interface
 */
export interface RazorpayContextType {
  /** Whether Razorpay script is loaded and ready */
  isLoaded: boolean;
  /** Loading state for script loading */
  isLoading: boolean;
  /** Error state if script loading failed */
  error: string | null;
  /** Razorpay instance (null if not loaded) */
  razorpay: RazorpayInstance | null;
  /** Function to manually retry loading the script */
  retry: () => Promise<void>;
  /** Check if Razorpay is available in window */
  isAvailable: () => boolean;
}

/**
 * Razorpay provider props
 */
interface RazorpayProviderProps {
  /** Child components */
  children: ReactNode;
  /** Custom timeout for script loading (default: 10 seconds) */
  timeout?: number;
  /** Whether to automatically load the script on mount (default: true) */
  autoLoad?: boolean;
  /** Callback when script loads successfully */
  onScriptLoaded?: () => void;
  /** Callback when script fails to load */
  onScriptError?: (error: Error) => void;
}

/**
 * Default context value
 */
const defaultContext: RazorpayContextType = {
  isLoaded: false,
  isLoading: false,
  error: null,
  razorpay: null,
  retry: async () => {},
  isAvailable: () => false,
};

// ============================================================================
// Razorpay Context
// ============================================================================

/**
 * Razorpay context for sharing state across components
 */
const RazorpayContext = createContext<RazorpayContextType>(defaultContext);

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access Razorpay context
 *
 * @example
 * const { isLoaded, razorpay, openCheckout } = useRazorpay();
 */
export function useRazorpay(): RazorpayContextType {
  const context = useContext(RazorpayContext);

  if (!context) {
    throw new Error('useRazorpay must be used within a RazorpayProvider');
  }

  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Razorpay script is available in window
 */
function isRazorpayScriptAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.Razorpay !== 'undefined' &&
    typeof window.Razorpay === 'function'
  );
}

/**
 * Wait for Razorpay script to be available
 */
function waitForRazorpay(timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isRazorpayScriptAvailable()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    const interval = setInterval(() => {
      if (isRazorpayScriptAvailable()) {
        clearInterval(interval);
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Razorpay script not available after ${timeout}ms timeout`));
      }
    }, checkInterval);
  });
}

/**
 * Load Razorpay script dynamically
 */
async function loadRazorpayScript(): Promise<void> {
  // Check if script is already loaded
  if (isRazorpayScriptAvailable()) {
    return;
  }

  // Return promise that resolves when script is available
  await waitForRazorpay(10000);
}

/**
 * Initialize Razorpay instance
 */
function initializeRazorpay(): RazorpayInstance | null {
  if (!isRazorpayScriptAvailable()) {
    return null;
  }

  try {
    const config = getRazorpayConfig();

    // Don't initialize if key is not configured
    if (!config.keyId) {
      console.warn('[RazorpayProvider] Razorpay key not configured');
      return null;
    }

    const instance = new window.Razorpay({
      key_id: config.keyId,
    });

    console.log('[RazorpayProvider] Razorpay instance initialized successfully');
    return instance;
  } catch (error) {
    console.error('[RazorpayProvider] Failed to initialize Razorpay instance:', error);
    return null;
  }
}

// ============================================================================
// Razorpay Provider Component
// ============================================================================

/**
 * RazorpayProvider component
 *
 * Provides Razorpay checkout functionality to child components
 *
 * @example
 * <RazorpayProvider>
 *   <MyApp />
 * </RazorpayProvider>
 */
export function RazorpayProvider({
  children,
  timeout = 10000,
  autoLoad = true,
  onScriptLoaded,
  onScriptError,
}: RazorpayProviderProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayInstance | null>(null);

  /**
   * Load Razorpay script and initialize instance
   */
  const loadScript = useCallback(async (): Promise<void> => {
    if (isLoaded || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wait for script to be available
      await loadRazorpayScript();

      // Initialize Razorpay instance
      const instance = initializeRazorpay();

      if (instance) {
        setRazorpay(instance);
        setIsLoaded(true);
        onScriptLoaded?.();
        console.log('[RazorpayProvider] Razorpay script loaded and instance created');
      } else {
        throw new Error('Failed to initialize Razorpay instance');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      onScriptError?.(error);
      console.error('[RazorpayProvider] Failed to load Razorpay:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, onScriptLoaded, onScriptError]);

  /**
   * Retry loading the script
   */
  const retry = useCallback(async (): Promise<void> => {
    console.log('[RazorpayProvider] Retrying Razorpay script load...');
    await loadScript();
  }, [loadScript]);

  /**
   * Check if Razorpay is available
   */
  const isAvailable = useCallback((): boolean => {
    return isRazorpayScriptAvailable();
  }, []);

  // Auto-load script on mount if enabled
  useEffect(() => {
    if (autoLoad && !isLoaded && !isLoading && !error) {
      loadScript();
    }
  }, [autoLoad, isLoaded, isLoading, error, loadScript]);

  // Monitor for script availability changes (in case script is loaded by other means)
  useEffect(() => {
    if (!isLoaded && !isLoading && !error && isRazorpayScriptAvailable()) {
      // Script became available through other means
      const instance = initializeRazorpay();
      if (instance) {
        setRazorpay(instance);
        setIsLoaded(true);
        onScriptLoaded?.();
      }
    }
  }, [isLoaded, isLoading, error, onScriptLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // No cleanup needed for Razorpay script as it's loaded globally
      console.log('[RazorpayProvider] Component unmounted');
    };
  }, []);

  const contextValue: RazorpayContextType = {
    isLoaded,
    isLoading,
    error,
    razorpay,
    retry,
    isAvailable,
  };

  return <RazorpayContext.Provider value={contextValue}>{children}</RazorpayContext.Provider>;
}

// ============================================================================
// Export
// ============================================================================

export default RazorpayProvider;
export type { RazorpayContextType, RazorpayProviderProps };
