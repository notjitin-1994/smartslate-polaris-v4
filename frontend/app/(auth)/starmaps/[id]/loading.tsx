import React from 'react';

export default function BlueprintLoading() {
  return (
    <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)] animate-pulse">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-white/5" />
              <div className="h-16 w-16 rounded-full bg-white/5" />
              <div className="space-y-2">
                <div className="h-10 w-48 rounded-lg bg-white/5" />
                <div className="h-5 w-32 rounded-lg bg-white/5" />
              </div>
            </div>
            <div className="h-10 w-24 rounded-lg bg-white/5" />
          </div>

          {/* Info Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex border-b border-white/10 mb-6">
              <div className="h-12 w-full bg-white/5" />
            </div>
            <div className="space-y-6">
              <div className="h-8 w-64 rounded-lg bg-white/5" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-white/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-40 rounded-xl bg-white/5" />
                <div className="h-40 rounded-xl bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
