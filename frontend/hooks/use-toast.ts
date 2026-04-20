/**
 * Simple toast notification hook
 * Compatible with the VisualJSONEditor component
 */

import { useState, useCallback } from 'react';

export interface Toast {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
  id: string;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = `toast-${toastId++}`;

    // For now, just use console logging
    // In production, you'd integrate with your toast component
    if (variant === 'destructive') {
      console.error(`[Toast] ${typeof title === 'string' ? title : 'Error'}:`, description);
    } else {
      console.log(`[Toast] ${typeof title === 'string' ? title : 'Info'}:`, description);
    }

    const newToast: Toast = { id, title, description, variant };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);

    return { id };
  }, []);

  return { toast, toasts };
}
