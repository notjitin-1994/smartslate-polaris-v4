/**
 * Global Error Handlers
 * Catches all unhandled errors and logs them automatically
 */

import { logger } from './logger';

let initialized = false;

/**
 * Initialize global error handlers for server-side
 * Catches unhandled rejections and uncaught exceptions
 */
export function initializeGlobalErrorHandlers(): void {
  // Prevent duplicate initialization
  if (initialized) {
    console.log('[GlobalErrorHandlers] Already initialized');
    return;
  }

  // Only run on server-side
  if (typeof window !== 'undefined') {
    console.warn('[GlobalErrorHandlers] Skipping server-side handlers on client');
    return;
  }

  console.log('[GlobalErrorHandlers] Initializing server-side error handlers...');

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('system.error', 'Unhandled promise rejection', {
      error: reason instanceof Error ? reason.message : String(reason),
      errorStack: reason instanceof Error ? reason.stack : undefined,
      promise: String(promise),
    });

    console.error('[UnhandledRejection]', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('system.error', 'Uncaught exception', {
      error: error.message,
      errorStack: error.stack,
      errorName: error.name,
    });

    console.error('[UncaughtException]', error);

    // Give logger time to flush before crashing
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle warnings
  process.on('warning', (warning: Error) => {
    logger.warn('system.warning', warning.message, {
      warningName: warning.name,
      warningStack: warning.stack,
    });
  });

  initialized = true;
  console.log('[GlobalErrorHandlers] Server-side handlers initialized successfully');
}

/**
 * Initialize client-side error handlers
 * Call this from a client component (e.g., in layout.tsx)
 */
export function initializeClientErrorHandlers(): void {
  if (typeof window === 'undefined') {
    console.warn('[GlobalErrorHandlers] Skipping client-side handlers on server');
    return;
  }

  console.log('[GlobalErrorHandlers] Initializing client-side error handlers...');

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    event.preventDefault(); // Prevent default browser behavior

    logger.error('ui.error', 'Unhandled promise rejection (client)', {
      error: event.reason instanceof Error ? event.reason.message : String(event.reason),
      errorStack: event.reason instanceof Error ? event.reason.stack : undefined,
    });

    console.error('[Client UnhandledRejection]', event.reason);
  });

  // Handle global errors
  window.addEventListener('error', (event: ErrorEvent) => {
    // Don't prevent default for script errors (let browser handle them)
    if (event.filename) {
      logger.error('ui.error', `Script error: ${event.message}`, {
        error: event.message,
        errorStack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    } else {
      logger.error('ui.error', `Global error: ${event.message}`, {
        error: event.message,
        errorStack: event.error?.stack,
      });
    }

    console.error('[Client Error]', event.error || event.message);
  });

  console.log('[GlobalErrorHandlers] Client-side handlers initialized successfully');
}

/**
 * Check if error handlers are initialized
 */
export function isInitialized(): boolean {
  return initialized;
}
