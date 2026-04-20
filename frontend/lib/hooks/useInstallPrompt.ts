'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }

      // Check for iOS standalone
      if (window.navigator && 'standalone' in window.navigator) {
        const standalone = (window.navigator as any).standalone;
        setIsInstalled(standalone);
        return standalone;
      }

      return false;
    };

    if (checkInstalled()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return { outcome: 'unavailable' as const };
    }

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    return { outcome };
  };

  const getInstallInstructions = () => {
    const ua = navigator.userAgent;

    if (ua.match(/iPhone|iPad|iPod/)) {
      return {
        platform: 'ios',
        instructions: [
          'Tap the Share button (square with arrow)',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm',
        ],
      };
    }

    if (ua.match(/Android/)) {
      return {
        platform: 'android',
        instructions: [
          'Tap the menu button (3 dots)',
          'Tap "Add to Home Screen" or "Install App"',
          'Follow the prompts',
        ],
      };
    }

    return {
      platform: 'desktop',
      instructions: [
        'Look for the install icon in the address bar',
        'Or use the browser menu → "Install Smartslate Polaris"',
        'Follow the prompts',
      ],
    };
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    getInstallInstructions,
  };
}
