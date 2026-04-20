/**
 * Blueprint Error Boundary
 * Catches and handles rendering errors in blueprint components
 */

'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('ui');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class BlueprintErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Blueprint render error', 'An error occurred while rendering blueprint');

    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="bg-error/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-error h-8 w-8" />
          </div>

          <h3 className="text-heading text-foreground mb-2">Error Displaying Section</h3>

          <p className="text-body text-text-secondary mx-auto mb-4 max-w-md">
            This section couldn't be displayed due to an error. The rest of your blueprint is
            unaffected.
          </p>

          {this.state.error && (
            <details className="glass-strong mx-auto mb-4 max-w-md rounded-lg p-4 text-left">
              <summary className="text-text-secondary hover:text-foreground cursor-pointer text-sm">
                Error Details
              </summary>
              <pre className="text-error mt-2 overflow-auto text-xs">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
