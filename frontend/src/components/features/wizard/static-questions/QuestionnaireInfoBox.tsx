'use client';

import React from 'react';

type QuestionnaireInfoBoxProps = {
  title?: string;
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning';
};

export function QuestionnaireInfoBox({
  title,
  children,
  variant = 'tip',
}: QuestionnaireInfoBoxProps): React.JSX.Element {
  const variantStyles = {
    info: {
      bg: 'bg-info/8',
      border: 'border-info/20',
      iconColor: 'text-info',
      textColor: 'text-foreground',
    },
    tip: {
      bg: 'bg-primary/8',
      border: 'border-primary/20',
      iconColor: 'text-primary-accent',
      textColor: 'text-primary-accent-light',
    },
    warning: {
      bg: 'bg-warning/8',
      border: 'border-warning/20',
      iconColor: 'text-warning',
      textColor: 'text-foreground',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`animate-fade-in rounded-xl ${styles.bg} border-[1.5px] ${styles.border} p-5 shadow-sm backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.iconColor}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1 space-y-2">
          {title && (
            <p className={`text-[15px] font-semibold ${styles.textColor} leading-tight`}>{title}</p>
          )}
          <div className="text-text-secondary space-y-2 text-[14px] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
