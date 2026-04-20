/**
 * Fullscreen API wrapper utilities
 * Cross-browser fullscreen functionality
 */

/**
 * Check if fullscreen is supported
 */
export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;

  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
}

/**
 * Get current fullscreen element
 */
export function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;

  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
}

/**
 * Check if currently in fullscreen
 */
export function isFullscreen(): boolean {
  return !!getFullscreenElement();
}

/**
 * Request fullscreen on an element
 */
export async function requestFullscreen(element: HTMLElement): Promise<void> {
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
    throw error;
  }
}

/**
 * Exit fullscreen
 */
export async function exitFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;

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
    throw error;
  }
}

/**
 * Toggle fullscreen
 */
export async function toggleFullscreen(element?: HTMLElement): Promise<void> {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    const targetElement = element || document.documentElement;
    await requestFullscreen(targetElement);
  }
}

/**
 * Add fullscreen change event listener
 */
export function addFullscreenChangeListener(handler: () => void): () => void {
  if (typeof document === 'undefined') return () => {};

  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  document.addEventListener('mozfullscreenchange', handler);
  document.addEventListener('MSFullscreenChange', handler);

  // Return cleanup function
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('mozfullscreenchange', handler);
    document.removeEventListener('MSFullscreenChange', handler);
  };
}

/**
 * Lock screen orientation in fullscreen (mobile)
 */
export async function lockOrientation(orientation: 'landscape' | 'portrait'): Promise<void> {
  if (typeof screen === 'undefined' || !(screen as any).orientation?.lock) {
    console.warn('Screen orientation lock not supported');
    return;
  }

  try {
    await (screen as any).orientation.lock(orientation);
  } catch (error) {
    console.error('Failed to lock orientation:', error);
  }
}

/**
 * Unlock screen orientation
 */
export function unlockOrientation(): void {
  if (typeof screen === 'undefined' || !(screen as any).orientation?.unlock) {
    return;
  }

  (screen as any).orientation.unlock();
}
