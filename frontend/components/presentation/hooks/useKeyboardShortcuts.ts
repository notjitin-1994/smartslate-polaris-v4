'use client';

import { useEffect, useCallback } from 'react';
import type { KeyboardShortcuts, NavigationDirection } from '@/types/presentation';

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcuts;
  enabled?: boolean;
  onNavigate: (direction: NavigationDirection) => void;
  onToggleFullscreen: () => void;
  onToggleSpeakerNotes: () => void;
  onToggleLaserPointer: () => void;
  onTogglePlay: () => void;
  onExit: () => void;
}

/**
 * Keyboard shortcuts hook for presentation navigation and control
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  onNavigate,
  onToggleFullscreen,
  onToggleSpeakerNotes,
  onToggleLaserPointer,
  onTogglePlay,
  onExit,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const key = event.key;

      // Prevent default browser shortcuts
      if (
        shortcuts.nextSlide.includes(key) ||
        shortcuts.previousSlide.includes(key) ||
        shortcuts.firstSlide.includes(key) ||
        shortcuts.lastSlide.includes(key) ||
        shortcuts.toggleFullscreen.includes(key) ||
        shortcuts.toggleSpeakerNotes.includes(key) ||
        shortcuts.toggleLaserPointer.includes(key) ||
        shortcuts.togglePlay.includes(key) ||
        shortcuts.exitPresentation.includes(key)
      ) {
        event.preventDefault();
      }

      // Navigation shortcuts
      if (shortcuts.nextSlide.includes(key)) {
        onNavigate('next');
      } else if (shortcuts.previousSlide.includes(key)) {
        onNavigate('previous');
      } else if (shortcuts.firstSlide.includes(key)) {
        onNavigate('first');
      } else if (shortcuts.lastSlide.includes(key)) {
        onNavigate('last');
      }
      // Control shortcuts
      else if (shortcuts.toggleFullscreen.includes(key)) {
        onToggleFullscreen();
      } else if (shortcuts.toggleSpeakerNotes.includes(key)) {
        onToggleSpeakerNotes();
      } else if (shortcuts.toggleLaserPointer.includes(key)) {
        onToggleLaserPointer();
      } else if (shortcuts.togglePlay.includes(key)) {
        onTogglePlay();
      } else if (shortcuts.exitPresentation.includes(key)) {
        onExit();
      }
    },
    [
      enabled,
      shortcuts,
      onNavigate,
      onToggleFullscreen,
      onToggleSpeakerNotes,
      onToggleLaserPointer,
      onTogglePlay,
      onExit,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [enabled, handleKeyPress]);
}
