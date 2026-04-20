'use client';

import React from 'react';
import Image from 'next/image';

type DynamicFormCardProps = {
  children: React.ReactNode;
  showLogo?: boolean;
};

export function DynamicFormCard({
  children,
  showLogo = true,
}: DynamicFormCardProps): React.JSX.Element {
  return (
    <div className="glass-card space-y-8 p-8 md:p-10">
      {showLogo && (
        <div className="animate-fade-in flex items-center justify-center pb-2">
          <Image
            src="/logo.png"
            alt="SmartSlate"
            width={140}
            height={38}
            className="h-10 w-auto opacity-90 transition-opacity duration-300 hover:opacity-100"
            priority
          />
        </div>
      )}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
