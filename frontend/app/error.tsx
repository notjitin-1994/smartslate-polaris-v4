'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

/**
 * Custom Error Page (App Router)
 *
 * Replaces default Next.js Pages Router error page to avoid Html component import issues.
 * Must be a Client Component to handle error and reset functionality.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-white">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mx-auto max-w-md text-lg text-slate-300">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mx-auto max-w-2xl rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
            <p className="font-mono text-sm break-all text-red-400">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-slate-400">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <button
            onClick={reset}
            className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-700/50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        {/* Additional Help */}
        <div className="pt-8 text-sm text-slate-400">
          <p>
            If this problem persists,{' '}
            <a
              href="mailto:support@smartslate.io"
              className="text-primary-400 hover:text-primary-300 underline underline-offset-4"
            >
              contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
