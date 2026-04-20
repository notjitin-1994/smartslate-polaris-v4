'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FullscreenState } from '@/types/presentation';

interface UseFullscreenReturn extends FullscreenState {
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

/**
 * Fullscreen API integration hook
 * Provides cross-browser fullscreen functionality
 */
export function useFullscreen(elementRef?: React.RefObject<HTMLElement>): UseFullscreenReturn {
  const [state, setState] = useState<FullscreenState>({
    isSupported: false,
    isFullscreen: false,
    element: null,
  });

  const containerRef = useRef<HTMLElement | null>(null);

  // Check fullscreen support
  useEffect(() => {
    const isSupported =
      typeof document !== 'undefined' &&
      (document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled);

    setState((prev) => ({ ...prev, isSupported }));
  }, []);

  // Update fullscreen state on change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const element =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      setState((prev) => ({
        ...prev,
        isFullscreen: !!element,
        element,
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Enter fullscreen
  const enter = useCallback(async () => {
    const element = elementRef?.current || containerRef.current || document.documentElement;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, [elementRef]);

  // Exit fullscreen
  const exit = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Toggle fullscreen
  const toggle = useCallback(async () => {
    if (state.isFullscreen) {
      await exit();
    } else {
      await enter();
    }
  }, [state.isFullscreen, enter, exit]);

  return {
    ...state,
    enter,
    exit,
    toggle,
  };
}
