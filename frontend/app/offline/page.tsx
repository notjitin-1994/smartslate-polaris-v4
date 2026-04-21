'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-lg">
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-white">You're Offline</h1>

        <p className="mb-8 text-gray-300">
          It looks like you've lost your internet connection. Don't worry, Smartslate Polaris will
          be back as soon as you're reconnected.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-lg font-semibold text-blue-300">What can you do?</h3>
            <ul className="space-y-2 text-left text-sm text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-blue-400">•</span>
                Check your internet connection
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-400">•</span>
                Try refreshing the page when online
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-400">•</span>
                Previously cached pages may still work
              </li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full transform rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition duration-200 hover:scale-105 hover:bg-blue-700 hover:shadow-xl"
          >
            Try Again
          </button>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs text-gray-400">Smartslate Polaris PWA v1.0</p>
        </div>
      </div>
    </div>
  );
}
