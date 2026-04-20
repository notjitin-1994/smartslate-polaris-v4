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

  /**
  * Error boundary component that catches rendering errors in its child tree and displays a user-friendly fallback UI with optional error details and a reset action.
  * @component
  * @example
  *   <BlueprintErrorBoundary fallback={<div>Fallback UI</div>}>
  *     <MySection />
  *   </BlueprintErrorBoundary>
  * @prop {{React.ReactNode}} fallback - Optional React node to render when an error is caught. If not provided, a built-in error panel is shown.
  * @prop {{React.ReactNode}} children - The child elements wrapped by this error boundary; rendered when no error has occurred.
  *
  * State:
  * - hasError {boolean} - Tracks whether an error has been caught and the boundary is in the error state.
  * - error {Error | null} - Stores the caught Error object (when available) to display details to the user.
  *
  * Lifecycle & Methods:
  * - static getDerivedStateFromError(error): Updates state to set hasError = true and capture the error. Ensures the boundary renders the fallback UI after a thrown error.
  * - componentDidCatch(error, info): Intended for side effects such as logging the error to an external service (optional in implementation).
  * - handleReset(): Resets the boundary state (clears hasError and error) so that children are attempted to be rendered again. This is wired to the "Try Again" button in the UI.
  *
  * Rendering logic:
  * - If state.hasError is true:
  *   - If props.fallback is provided, return that node (allowing callers to supply a custom fallback UI).
  *   - Otherwise render a default, styled error panel containing:
  *     - a prominent error icon,
  *     - a headline "Error Displaying Section",
  *     - a short explanatory paragraph that the rest of the blueprint is unaffected,
  *     - an expandable <details> block (when error is present) showing the error.message for debugging,
  *     - and a "Try Again" button that triggers handleReset to attempt re-rendering children.
  * - If no error is present, return props.children so the wrapped content renders normally.
  */
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
