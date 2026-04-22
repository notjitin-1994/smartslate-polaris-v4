/**
 * Keyboard Shortcuts Hook
 * Manages keyboard shortcuts with modifier key support
 */

import { useEffect, useRef } from 'react';

type KeyboardShortcut = {
  [key: string]: () => void;
};

interface ShortcutOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut, options: ShortcutOptions = {}) {
  const { preventDefault = true, stopPropagation = true, enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build shortcut string
      const modifiers = [];
      if (event.metaKey || event.ctrlKey) modifiers.push('cmd');
      if (event.altKey) modifiers.push('alt');
      if (event.shiftKey) modifiers.push('shift');

      // Get the key
      let key = event.key.toLowerCase();

      // Normalize special keys
      if (key === ' ') key = 'space';
      if (key === 'arrowup') key = 'up';
      if (key === 'arrowdown') key = 'down';
      if (key === 'arrowleft') key = 'left';
      if (key === 'arrowright') key = 'right';

      // Build the full shortcut string
      const shortcut = [...modifiers, key].join('+');

      // Check if we have a handler for this shortcut
      const handler = shortcutsRef.current[shortcut];

      if (handler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();

        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
        const isContentEditable = target.contentEditable === 'true';

        if (!isInput && !isContentEditable) {
          handler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, preventDefault, stopPropagation]);
}

// Utility function to display shortcuts in UI
export function formatShortcut(shortcut: string): string {
  const isMac =
    typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return shortcut
    .split('+')
    .map((key) => {
      switch (key) {
        case 'cmd':
          return isMac ? '⌘' : 'Ctrl';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'shift':
          return '⇧';
        case 'space':
          return 'Space';
        case 'escape':
          return 'Esc';
        case 'enter':
          return '↵';
        case 'up':
          return '↑';
        case 'down':
          return '↓';
        case 'left':
          return '←';
        case 'right':
          return '→';
        default:
          return key.toUpperCase();
      }
    })
    .join('');
}
