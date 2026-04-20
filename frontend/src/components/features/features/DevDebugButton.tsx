import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiDebugStore } from '@/dev/apiDebug';
import { errorTrackerStore } from '@/dev/errorTracker';

export function DevDebugButton() {
  const [errorCount, setErrorCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const compute = () => {
      const apiErrors = apiDebugStore
        .get()
        .filter((l) => l.ok === false || (typeof l.status === 'number' && l.status >= 400)).length;
      const runtimeErrors = errorTrackerStore.get().length;
      setErrorCount(apiErrors + runtimeErrors);
    };
    compute();
    const unsubA = apiDebugStore.subscribe(compute);
    const unsubB = errorTrackerStore.subscribe(compute);
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  if (!import.meta.env.DEV) return null;
  if (location.pathname.startsWith('/dev/debug')) return null;

  return (
    <Link to="/dev/debug" className="fixed right-4 bottom-4 z-50">
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition-colors hover:bg-white/20">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 17v-6a2 2 0 012-2h4m4 8V7a2 2 0 00-2-2h-7l-4 4v10a2 2 0 002 2h9a2 2 0 002-2z"
            />
          </svg>
        </div>
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full border border-white/30 bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
            {errorCount}
          </span>
        )}
      </div>
    </Link>
  );
}
