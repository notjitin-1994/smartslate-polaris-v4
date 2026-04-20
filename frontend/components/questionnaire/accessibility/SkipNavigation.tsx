'use client';

import React from 'react';

export function SkipNavigation() {
  return (
    <a href="#main-content" className="skip-nav focus:top-4 focus:left-4">
      Skip to main content
    </a>
  );
}

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main id="main-content" tabIndex={-1} className={className}>
      {children}
    </main>
  );
}
