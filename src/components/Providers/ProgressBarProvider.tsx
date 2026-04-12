'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="2px"
        color="#A7DADB"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
