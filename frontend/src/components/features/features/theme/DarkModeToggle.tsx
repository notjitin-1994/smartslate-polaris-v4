'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  className?: string;
}

export function DarkModeToggle({ className }: DarkModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn('glass rounded-lg px-3 py-2', 'flex items-center gap-2', className)}>
        <Sun className="h-4 w-4" />
        <span className="text-sm font-medium">Light</span>
      </div>
    );
  }

  const toggleTheme = () => {
    // Toggle between light and dark
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getIcon = () => {
    return theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'glass rounded-xl px-3 py-2',
        'text-foreground hover:glass-strong',
        'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2',
        'transition-all duration-200 focus-visible:outline-none',
        'flex items-center gap-2 active:scale-95',
        className
      )}
      aria-label={`Toggle theme (current: ${getLabel()})`}
      title={`Current theme: ${getLabel()}`}
    >
      <span className="transition-transform duration-200 hover:rotate-12">{getIcon()}</span>
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  );
}
