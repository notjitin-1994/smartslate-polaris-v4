/**
 * Global Error Boundary
 * Catches React errors and logs them to the server
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Dynamic import to avoid server-side issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clientErrorTracker: any = null;
try {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    clientErrorTracker = require('@/lib/logging/clientErrorTracker').clientErrorTracker;
  }
} catch {
  // Fallback - error tracker not available
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to server - only if clientErrorTracker is available
    try {
      if (typeof clientErrorTracker !== 'undefined' && clientErrorTracker.captureReactError) {
        clientErrorTracker.captureReactError(error, {
          componentStack: errorInfo.componentStack || undefined,
        });
      }
    } catch (trackingError) {
      // Fallback to console logging if error tracker fails
      console.error('[Error Boundary] Failed to track error:', trackingError);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Global Error Boundary] Caught error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
            <div className="mb-4">
              <svg
                className="text-error mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-heading text-foreground mb-2">Oops! Something went wrong</h1>

            <p className="text-body text-text-secondary mb-6">
              We've been notified about this error and are working to fix it. Please try refreshing
              the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left text-sm">
                <summary className="text-text-secondary hover:text-foreground mb-2 cursor-pointer transition-colors">
                  Error Details (Development Only)
                </summary>
                <div className="bg-surface max-h-48 overflow-auto rounded-lg p-4">
                  <p className="text-error mb-2 font-mono text-xs break-words">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-text-secondary font-mono text-xs whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-secondary/50 rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50 rounded-lg px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
