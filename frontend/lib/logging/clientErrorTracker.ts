/**
 * Client-Side Error Tracking
 * Automatically captures and reports client-side errors to the server
 */

'use client';

interface ErrorPayload {
  level: 'error' | 'warn' | 'info';
  event: string;
  message: string;
  metadata: {
    error?: string;
    errorStack?: string;
    errorCode?: string;
    url: string;
    userAgent: string;
    componentStack?: string;
    [key: string]: unknown;
  };
}

class ClientErrorTracker {
  private endpoint = '/api/logs/client';
  private isInitialized = false;
  private queue: ErrorPayload[] = [];
  private isProcessing = false;

  /**
   * Initialize error tracking
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'window.error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledrejection',
        promise: event.promise,
      });
    });

    this.isInitialized = true;
  }

  /**
   * Manually capture an error
   */
  captureError(error: Error | unknown, context: Record<string, unknown> = {}): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    const payload: ErrorPayload = {
      level: 'error',
      event: 'ui.error.captured',
      message: errorObj.message || 'Unknown error',
      metadata: {
        error: errorObj.message,
        errorStack: errorObj.stack,
        errorCode: (errorObj as any).code,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
    };

    this.queueError(payload);
  }

  /**
   * Manually log a warning
   */
  captureWarning(message: string, context: Record<string, unknown> = {}): void {
    const payload: ErrorPayload = {
      level: 'warn',
      event: 'ui.warning.captured',
      message,
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
    };

    this.queueError(payload);
  }

  /**
   * Manually log an info message
   */
  captureInfo(message: string, context: Record<string, unknown> = {}): void {
    const payload: ErrorPayload = {
      level: 'info',
      event: 'ui.info.captured',
      message,
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
    };

    this.queueError(payload);
  }

  /**
   * Queue error for sending
   */
  private queueError(payload: ErrorPayload): void {
    this.queue.push(payload);
    this.processQueue();
  }

  /**
   * Process error queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      if (payload) {
        try {
          await this.sendError(payload);
        } catch (error) {
          // If sending fails, put it back in the queue
          this.queue.unshift(payload);
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send error to server
   */
  private async sendError(payload: ErrorPayload): Promise<void> {
    try {
      // Additional safety check - ensure we're in a proper browser context
      if (typeof window === 'undefined' || !window.fetch) {
        throw new Error('Not in browser context');
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send error: ${response.statusText}`);
      }
    } catch (error) {
      // Log to console as fallback
      console.error('[Error Tracker] Failed to send error to server:', error);
      throw error;
    }
  }

  /**
   * Capture React error boundary errors
   */
  captureReactError(error: Error, errorInfo: { componentStack?: string }): void {
    this.captureError(error, {
      type: 'react.error',
      componentStack: errorInfo.componentStack,
    });
  }
}

// Singleton instance
export const clientErrorTracker = new ClientErrorTracker();

// Auto-initialize on import (client-side only)
// Delay initialization to ensure we're really in browser context
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure we're in a proper browser context
  setTimeout(() => {
    try {
      clientErrorTracker.init();
    } catch (error) {
      console.warn('[Error Tracker] Failed to initialize:', error);
    }
  }, 100); // Increased delay to allow all modules to load
}
