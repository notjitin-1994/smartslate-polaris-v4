'use client';

import { Toaster } from 'sonner';

/**
 * ToastProvider - Global toast notification provider
 * Uses sonner for beautiful, accessible toast notifications
 *
 * Features:
 * - Beautiful default styling
 * - Promise-based loading states
 * - Customizable with TailwindCSS
 * - Accessible (ARIA compliant)
 *
 * @see https://sonner.emilkowal.ski/
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'glass-card border-neutral-200',
          title: 'text-foreground font-medium',
          description: 'text-text-secondary',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-surface text-foreground',
          closeButton: 'bg-surface text-foreground hover:bg-surface/80',
        },
      }}
    />
  );
}
