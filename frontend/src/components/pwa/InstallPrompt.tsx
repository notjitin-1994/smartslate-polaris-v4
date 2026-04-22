'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if it's installed as a PWA
    if (window.navigator && 'standalone' in window.navigator) {
      setIsInstalled((window.navigator as any).standalone);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install banner
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS Safari or browsers that don't support beforeinstallprompt
      if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
        alert(
          'To install Smartslate Polaris:\n\n' +
            '1. Tap the Share button (square with arrow)\n' +
            '2. Scroll down and tap "Add to Home Screen"\n' +
            '3. Tap "Add" to confirm'
        );
      } else {
        alert(
          'To install Smartslate Polaris:\n\n' +
            '• Chrome/Edge: Look for the install icon in the address bar\n' +
            '• Or use browser menu → "Install app" or "Add to Home Screen"'
        );
      }
      return;
    }

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Store dismissal in localStorage to not annoy the user
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallBanner) {
    return null;
  }

  // Check if user previously dismissed
  if (typeof window !== 'undefined' && localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null;
  }

  return (
    <>
      {/* Floating Install Button (bottom-right corner) */}
      <button
        onClick={handleInstallClick}
        className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
        title="Install Smartslate Polaris"
      >
        <Download className="h-5 w-5" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Optional: Banner at top of page */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            <p className="text-sm font-medium">
              Install Smartslate Polaris for a faster, app-like experience!
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="rounded-md bg-white px-3 py-1 text-sm font-medium text-blue-600 transition hover:bg-gray-100"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-md p-1 transition hover:bg-blue-800"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
