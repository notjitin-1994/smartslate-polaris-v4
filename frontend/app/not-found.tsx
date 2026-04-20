'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

/**
 * Custom 404 Not Found Page (App Router)
 *
 * Replaces default Next.js Pages Router 404 page to avoid Html component import issues.
 * This must be a Client Component since it uses event handlers (onClick) and browser APIs (window.history).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-white">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-primary-400 text-9xl font-bold tracking-tighter">404</h1>
          <div className="from-primary-400 to-accent-400 mx-auto h-1 w-32 rounded-full bg-gradient-to-r" />
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="mx-auto max-w-md text-lg text-slate-300">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Link
            href="/"
            className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-700/50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="pt-8 text-sm text-slate-400">
          <p>
            Need help?{' '}
            <a
              href="mailto:support@smartslate.io"
              className="text-primary-400 hover:text-primary-300 underline underline-offset-4"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
